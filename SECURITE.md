# Sécurité — DMN-BU

Audit réalisé le 2026-11-09/10, correctifs déployés le 2026-11-10 (commits `9170852` puis déploiement confirmé — bucket MinIO passé en `private`).

---

## Risques identifiés et corrigés

### 🔴 Critique

**1. Aucun rate-limit sur login/inscription/reset mot de passe**
Un attaquant pouvait tester des mots de passe en boucle sur `/api/auth/token/` ou spammer `/api/auth/password-reset/` sans aucune limite — brute-force de comptes, déni de service par email, énumération.

→ **Corrigé** : `ScopedRateThrottle` (DRF) sur les 3 vues sensibles.
- `LoginView` (`/api/auth/token/`) : 10 tentatives/minute
- `RegisterView` (`/api/auth/register/`) : 5/minute
- `PasswordResetRequestView` + `PasswordResetConfirmView` : 5/minute (scope partagé)

Fichiers : `backend/dmn_bu/settings/base.py` (config des taux), `backend/apps/accounts/views.py` (attribut `throttle_scope` sur chaque vue), `backend/apps/accounts/urls.py` (nouvelle `LoginView` à la place du `TokenObtainPairView` brut de SimpleJWT).

**2. Bucket MinIO en lecture publique totale**
Le bucket avait une policy anonyme (`mc anonymous set download`) + ACL `public-read` sur chaque objet. N'importe qui connaissant (ou devinant, vu que les noms de fichiers n'étaient pas randomisés) l'URL d'un document pouvait le télécharger — y compris des mémoires **rejetés ou en attente**, jamais censés être visibles. La permission Django ne protégeait que l'API, pas le fichier brut sur MinIO.

→ **Corrigé** :
- `mc anonymous set none` au lieu de `download` dans `docker-compose.prod.yml::storage-init` — force le bucket en privé à chaque déploiement (idempotent, corrige aussi un bucket déjà rendu public par un déploiement antérieur).
- `default_acl: "private"` côté Django (`STORAGES` dans `settings/production.py` et `development.py`).
- Tous les liens de fichiers (liste, détail, bouton télécharger) passent maintenant par des **URLs signées (SigV4), valables 10 minutes**, générées à la volée par `backend/apps/documents/storage_utils.py::presigned_file_url()`.

**Comment ça marche techniquement** : la signature est calculée avec l'endpoint interne Docker (`storage:9000`, même host que le client S3 du backend), puis seul le host/schéma est substitué par le domaine public avant de renvoyer l'URL au frontend. Pour que la signature reste valide malgré ce changement de host côté navigateur, le nginx du sous-domaine `storage-bnumerique.dmnucad.com` force le header `Host` vers `storage:9000` en amont (`deploy/nginx/storage-bnumerique.dmnucad.com.conf`) — sans ça, MinIO rejetterait la requête avec une erreur de signature (403).

### 🟠 Modéré

**3. Upload de document sans aucune validation**
N'importe quel type de fichier pouvait être soumis comme "document" (pas de contrôle d'extension, de type MIME, ni de taille) — un `.html`/`.svg` malveillant aurait pu être hébergé et servi tel quel.

→ **Corrigé** (`backend/apps/documents/serializers.py::DocumentSoumissionSerializer.validate_fichier`) :
- Extension `.pdf` obligatoire
- Vérification des octets magiques (`%PDF-` en tête de fichier) — bloque un fichier juste renommé en `.pdf`
- Taille max 50 Mo
- Même contrôle d'extension dupliqué au niveau du modèle (`FileExtensionValidator`, défense en profondeur pour les autres points d'entrée type admin Django).

**4. Pas de HSTS**
Rien ne forçait le navigateur à rester en HTTPS sur ce domaine.

→ **Corrigé** : `SECURE_HSTS_SECONDS = 15552000` (180 jours) + `SECURE_HSTS_INCLUDE_SUBDOMAINS = True` dans `settings/production.py`. Pas de `preload` activé volontairement (trop définitif pour un premier rollout, difficile à annuler).

### 🟢 Déjà bon (confirmé pendant l'audit, rien à changer)

- `DEBUG=False` en prod, pas de traces exposées aux utilisateurs.
- Cookies `Secure`, `CSRF_TRUSTED_ORIGINS`, `SECURE_PROXY_SSL_HEADER` bien positionnés.
- JWT : rotation + blacklist des refresh tokens.
- Aucun secret commité (`.env.production` absent du repo, seulement des `.example`).
- Docker : `db`/`redis`/`search` n'exposent aucun port à l'hôte ; `backend`/`frontend`/`storage` bindés sur `127.0.0.1` seulement.
- ORM partout, pas d'injection SQL évidente.
- Réponse générique sur le reset password (pas d'énumération d'emails).
- Dépendances à jour (Django 6.0.7, DRF 3.17, SimpleJWT 5.5, Next.js 16.2.9).

---

## Reste à faire (identifié mais pas traité, pas critique)

- **CSP** (Content-Security-Policy) : aucune définie. Si une faille XSS apparaît un jour côté frontend, rien ne limite son impact. Pas ajoutée car risque de casser des scripts/styles du site sans pouvoir tester en conditions réelles — à faire avec une vraie phase de test (console navigateur pour repérer les violations) avant de passer en mode strict.
- **HSTS preload** : à activer plus tard une fois le HTTPS confirmé stable sur une longue période.

---

## Vérification à faire après déploiement (checklist)

Déployé le 2026-11-10, logs de `storage-init` confirmés (`Access permission for local/dmn-bu-documents is set to private`). Tests fonctionnels **pas encore faits** — à faire dès que possible :

- [ ] Ouvrir/télécharger un document existant (membre + public) → doit toujours marcher normalement.
- [ ] Prendre l'URL d'un fichier dans l'onglet réseau du navigateur, retirer tout ce qui suit le `?` (donc sans signature), l'ouvrir en navigation privée → doit donner une erreur d'accès refusé.
- [ ] Se tromper de mot de passe 10+ fois rapidement sur la connexion → doit finir par renvoyer "trop de tentatives" (429).
- [ ] Soumettre un fichier `.txt` renommé en `.pdf` → doit être rejeté.

**Si le téléchargement/la prévisualisation casse** après déploiement : le point le plus fragile est le header `Host` figé dans `deploy/nginx/storage-bnumerique.dmnucad.com.conf` — vérifier qu'il a bien été rechargé (`nginx -t && reload`, ou recréer le conteneur/service nginx selon comment il tourne).
