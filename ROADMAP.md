# Roadmap — DMN-BN

Backlog noté le 2026-11-16, à partir des retours utilisateur. Chaque item est à cocher une fois livré ET déployé.

---

## 1. Navigation admin ↔ membre — ✅ fait (2026-11-16)

- [x] Un admin est aussi un membre (il peut consulter/soumettre des documents comme tout membre) — faciliter le switch entre les deux interfaces (`/gestion/...` et le reste du site) depuis la nav, sans repasser par une reconnexion.

**Implémentation** : le lien "Administration" existait déjà côté site membre (menu du profil, `public-navbar.tsx`). Ajouté le sens inverse : entrée "Espace membre" dans la sidebar admin (`admin-sidebar.tsx`) qui renvoie vers `/`. Même session JWT des deux côtés — aucune reconnexion nécessaire (`AuthGuard` du layout membre n'exige qu'un utilisateur authentifié, pas un rôle précis).

## 2. Refonte UI (composants "moches"/non finis)

- [ ] Remplacer les éléments bruts/mal stylés par des composants propres et cohérents (Base UI déjà en place dans le projet, ou shadcn) — à traiter progressivement, écran par écran.
- [x] Exemple cité : le panneau qui s'ouvre au clic sur "Profil" (infos un peu collées, pas assez d'air/de structure) — ✅ fait (2026-11-16). C'était le menu déroulant du profil dans `public-navbar.tsx` : `DropdownMenuContent` par défaut n'a que `p-1` et les items `py-1` (composant volontairement compact, utilisé ailleurs dans l'app pour des menus simples — pas touché au niveau global). Corrigé uniquement sur cette instance : passé de `w-56` à `w-72`, en-tête (avatar+nom+email) agrandi avec plus de padding/gap, badge de rôle ajouté (Membre/Admin/Super admin), items espacés (`py-2`). Reste à faire au fil de l'eau : repérer d'autres endroits "collés" au cas par cas (pas de liste exhaustive pour l'instant).
- [x] **Responsive sur la partie admin (`/gestion/...`)** — ✅ fait (2026-11-16) : voir détail ci-dessous.

**Responsive admin — détail de ce qui a été corrigé** :
- `submission-detail-drawer.tsx` : panneau d'infos en `w-[400px]` fixe + viewer PDF côte à côte — ne rentrait sur aucun écran de téléphone (bug le plus sérieux trouvé, le drawer d'approbation était quasi inutilisable sur mobile). Passé en colonne empilée sous `lg`, côte à côte seulement à partir de `lg`.
- `gestion/documents/[id]/page.tsx` : panneau métadonnées + viewer PDF forcés à une hauteur égale (`calc(100vh-12rem)`) et `sticky` même en layout empilé mobile → doublait la hauteur de page inutilement. Hauteurs/sticky maintenant réservés à `lg+`.
- `gestion/membres/page.tsx` : rangée de 3 cartes stats en `flex` sans wrap (se tassaient sur mobile) → passée en `grid grid-cols-1 sm:grid-cols-3`.
- En-têtes de page (`membres`, `documents`) avec titre + boutons sans `flex-wrap` → ajouté, pour éviter le débordement sur petit écran.
- Grilles de formulaire `grid-cols-2` denses (édition document, upload en lot) → `grid-cols-1 sm:grid-cols-2` pour respirer sur mobile.
- Déjà bon sans y toucher : sidebar admin (shadcn, tiroir off-canvas natif sur mobile), tableaux (`Table` a déjà un wrapper `overflow-x-auto` intégré + colonnes masquées progressivement), dashboard, page classification.

## 3. Gestion des rôles (membre ↔ admin) — ✅ fait (2026-11-16)

- [x] Depuis l'interface admin : pouvoir changer le rôle d'un membre → admin, et inversement.
- [x] **Règle** : un admin "normal" peut promouvoir un membre en admin, mais **ne peut pas** :
  - changer le rôle d'un autre admin (admin → membre),
  - changer le mot de passe d'un autre admin.
  Seul le **super admin** peut faire ces deux actions.

**Implémentation** : `POST /api/membres/<id>/set-role/` (`AdminSetRoleView`, `backend/apps/accounts/views.py`) — promotion `membre→admin` ouverte à tout admin, rétrogradation `admin→membre` réservée à `request.user.is_superuser`. `AdminSetPasswordView` corrigée avec la même exception super admin (elle bloquait le changement de mot de passe d'un autre admin sans distinction auparavant). UI dans `frontend/src/app/gestion/membres/page.tsx` (boutons promouvoir/rétrograder dans la liste et le panneau détail).

## 4. Config : masquer "Publier/Approuver" sur les documents déjà rejetés — ✅ fait (2026-11-16)

- [x] Ajouter un paramètre (visible et modifiable depuis le Django admin) qui contrôle l'affichage des boutons "Publier"/"Approuver" sur un document déjà rejeté.
- [x] **Par défaut : caché** (les boutons ne s'affichent pas sur un document rejeté, sauf si l'admin active explicitement le paramètre).

**Implémentation** : modèle singleton `Configuration` (`backend/apps/documents/models.py`, migration `0006_configuration`) avec le champ `afficher_boutons_documents_rejetes` (défaut `False`), modifiable uniquement depuis `/admin/documents/configuration/` (une seule ligne, non supprimable). Exposé en lecture aux admins via `GET /api/configuration/` (`ConfigurationView`). Frontend : `gestion/soumissions/page.tsx` charge ce réglage au montage et l'applique à la fois dans le tableau et dans `submission-detail-drawer.tsx` (prop `afficherBoutonsRejetes`) — les boutons Approuver/Rejeter restent par défaut invisibles sur un document rejeté, et apparaissent seulement si le super admin active le paramètre.

## 5. Sous-rôles admin par type de document (validation ciblée) — ✅ fait (2026-11-16)

- [x] Tous les admins voient toutes les soumissions, mais seuls ceux habilités peuvent les **valider** (approuver/rejeter) :
  - habilitation par type de document (thèse, mémoire master, mémoire licence, article, rapport...) ;
  - un admin sans l'habilitation sur un type voit le document mais pas le(s) bouton(s) d'action pour ce type ;
  - un admin peut cumuler plusieurs habilitations (ex : thèses + mémoires master) ;
  - le **super admin** n'a aucune restriction (peut tout valider, quel que soit le type).
- [x] Gestion des habilitations : uniquement par le **super admin**, depuis l'API, au moment de la création ou de la modification d'un membre/admin (attribuer/révoquer).
- [x] Les autres admins gardent leurs capacités actuelles sans restriction (créer un membre, le promouvoir en admin) — seule la gestion fine des habilitations de validation et la rétrogradation admin→membre sont réservées au super admin.

**Implémentation** :
- `User.types_valides` (ArrayField de strings, `backend/apps/accounts/models.py`) — migration `0005_user_types_valides`.
- `PeutValiderDocument` (`backend/apps/documents/views.py`) : permission objet sur les actions `approuver`/`rejeter` — super admin toujours OK, admin normal seulement si `doc.type in user.types_valides`. Câblée via `get_permissions()` (⚠️ le `@action(permission_classes=...)` seul ne suffit pas ici, cette vue override `get_permissions()`).
- `POST /api/membres/<id>/set-permissions/` (`AdminSetValidationPermissionsView`) — réservé à `is_superuser`, aussi utilisable à la création via `POST /api/membres/` (champ `types_valides`, ignoré si le créateur n'est pas super admin).
- Frontend : boutons Approuver/Rejeter masqués côté `gestion/soumissions/page.tsx` et `submission-detail-drawer.tsx` via `peutValiderType(user, doc.type)` (`frontend/src/lib/api.ts`) — au passage, le drawer affichait ces boutons même sur un document déjà approuvé/rejeté (bug latent lié à l'item 4), corrigé en même temps en les limitant à `statut === "en_attente"`.
- "Super admin" = champ Django natif `User.is_superuser` (pas de nouveau champ ajouté) — à activer via Django admin ou `createsuperuser`, jamais via l'API publique.

---

## Notes d'implémentation (à affiner en démarrant chaque item)

- "Super admin" : à priori le champ Django `is_superuser` déjà présent sur le modèle `User` peut servir directement de marqueur super admin applicatif, sans ajouter de nouveau champ.
- Habilitations par type (item 5) : probablement un champ liste (`ArrayField` de `TypeDocument`) sur `User`, du même genre que `mots_cles` sur `Document`.
- Config "boutons sur rejeté" (item 4) : un modèle singleton simple, édité via le Django admin, exposé en lecture par l'API pour le frontend.
