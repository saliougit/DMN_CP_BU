# DMN-BU — Bibliothèque Numérique du Daara Madjmahoun Noreyni

Plateforme de gestion et de consultation des travaux académiques des membres du **Daara Madjmahoun Noreyni (UCAD, Dakar)** — mémoires de licence, mémoires de master, thèses de doctorat et articles de recherche, classés par faculté, filière, niveau et année.

---

## Fonctionnalités

| Profil | Accès |
|---|---|
| **Visiteur** | Recherche, consultation et téléchargement des documents publiés |
| **Membre** | Idem + soumission de ses propres travaux, suivi du statut |
| **Admin** | Gestion complète : approbation/rejet, upload direct, arborescence UCAD, gestion des membres |

**Workflow de publication :** soumission membre → vérification admin → approbation/rejet → email de notification → classement automatique dans l'arborescence

---

## Stack technique

```
VPS Hostinger KVM 2 (Ubuntu 22.04 · Docker Compose)
├── Next.js 16       → Frontend (App Router, TypeScript, Tailwind v4)
├── Django 6 + DRF   → API REST (logique métier, auth JWT, workflow)
├── PostgreSQL 16    → Base de données principale
├── Redis 7          → Cache Django + broker Celery
├── Celery           → Tâches async (emails d'approbation/rejet)
├── Meilisearch      → Moteur de recherche full-text
├── MinIO            → Stockage des PDFs (API S3 self-hosted)
└── Nginx            → Reverse proxy + SSL (Let's Encrypt / Certbot)
```

---

## Arborescence du projet

```
DMN_BU/
│
├── docker-compose.yml          # Orchestration : 9 services Docker
├── .env                        # Variables d'environnement (non committé)
├── .env.example                # Modèle à copier
│
├── nginx/
│   └── nginx.conf              # Reverse proxy HTTP + HTTPS (bloc SSL commenté)
│
├── frontend/                   # Application Next.js (App Router)
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── (public)/       # Pages sans connexion requise
│       │   ├── (auth)/         # Connexion, inscription
│       │   ├── (membre)/       # Espace membre (AuthGuard)
│       │   └── admin/          # Tableau de bord administrateur (AdminGuard)
│       ├── components/
│       ├── contexts/
│       │   └── auth-context.tsx        → Contexte JWT (login, logout avec blacklist)
│       └── lib/
│           ├── api.ts                  → Client HTTP (fetch + auto-refresh token)
│           └── mock-data.ts            → Données de développement
│
└── backend/                    # Application Django
    ├── Dockerfile
    ├── requirements.txt
    ├── manage.py
    ├── scripts/
    │   └── entrypoint.sh       # Attente DB → migrate → collectstatic (si gunicorn) → exec
    ├── dmn_bu/
    │   ├── celery.py           # App Celery (autodiscovery des tâches)
    │   ├── __init__.py         # Import celery au démarrage Django
    │   ├── urls.py
    │   └── settings/
    │       ├── base.py         # Config commune (DB, DRF, JWT, Redis, Celery, Email, MinIO, Meili)
    │       ├── development.py  # DEBUG=True, MinIO local
    │       └── production.py   # Sécurité HTTPS, MinIO, whitenoise
    └── apps/
        ├── accounts/
        │   ├── models.py       → User (AbstractUser + rôle admin/membre)
        │   ├── backends.py     → EmailBackend (login par email)
        │   ├── views.py        → RegisterView, ProfileView, LogoutView (blacklist JWT)
        │   └── urls.py         → /api/auth/token/, /api/auth/logout/, /api/auth/me/
        ├── classification/
        │   ├── models.py       → Faculte, Filiere, Niveau
        │   └── urls.py         → /api/facultes/, /api/niveaux/
        └── documents/
            ├── models.py       → Document (type, statut, FK classification, fichier MinIO)
            ├── views.py        → DocumentViewSet + approuver/rejeter/download
            ├── search.py       → Couche Meilisearch (index/delete/ensure)
            ├── signals.py      → Auto-indexation + déclenchement emails Celery
            ├── tasks.py        → notifier_approbation, notifier_rejet (Celery)
            └── urls.py         → /api/documents/
```

---

## Démarrage rapide

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- Git

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd DMN_BU
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec les valeurs réelles
```

Variables à renseigner dans `.env` :

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(50))"` |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `MEILI_MASTER_KEY` | Clé Meilisearch (chaîne aléatoire) |
| `MINIO_ROOT_PASSWORD` | Mot de passe MinIO |
| `EMAIL_HOST_USER` | Adresse Gmail |
| `EMAIL_HOST_PASSWORD` | [App Password Gmail](https://myaccount.google.com/apppasswords) (16 chars) |
| `SEND_REAL_EMAILS` | `True` pour envoyer de vrais emails, `False` pour logs console |

### 3. Lancer tous les services

```bash
docker compose up --build -d
```

C'est tout. Le démarrage est automatique et dans l'ordre :

1. PostgreSQL démarre et passe le healthcheck
2. Redis démarre
3. MinIO démarre → `storage-init` crée le bucket `dmn-documents`
4. Meilisearch démarre avec la clé du `.env`
5. Backend lance les migrations puis Gunicorn
6. Celery worker démarre
7. Frontend compile et démarre
8. Nginx active le reverse proxy

### Services accessibles

| Service | URL locale |
|---|---|
| Site web | http://localhost |
| API Django | http://localhost/api/ |
| Admin Django | http://localhost/admin/ |
| Console MinIO | http://localhost:9001 |
| Meilisearch | http://localhost:7700 |

---

## Développement local (sans Docker complet)

### Démarrer uniquement l'infrastructure

```bash
# PostgreSQL + Redis + MinIO + Meilisearch (en arrière-plan)
docker compose up db redis storage storage-init search -d
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_ucad    # charge la structure UCAD (facultés, filières, niveaux)
python manage.py createsuperuser
python manage.py runserver    # http://localhost:8000
```

### Worker Celery (emails async)

```bash
cd backend
celery -A dmn_bu worker --loglevel=info
```

---

## API — Principaux endpoints

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/token/` | Connexion → JWT access + refresh | — |
| `POST` | `/api/auth/token/refresh/` | Renouveler le token | — |
| `POST` | `/api/auth/logout/` | Déconnexion + blacklist du refresh | JWT |
| `POST` | `/api/auth/register/` | Créer un compte membre | — |
| `GET` | `/api/auth/me/` | Profil de l'utilisateur connecté | JWT |
| `GET` | `/api/documents/` | Liste des documents (filtrés, paginés) | — |
| `POST` | `/api/documents/` | Soumettre un document | JWT |
| `GET` | `/api/documents/{id}/` | Détail d'un document | — |
| `POST` | `/api/documents/{id}/approuver/` | Approuver une soumission | Admin |
| `POST` | `/api/documents/{id}/rejeter/` | Rejeter une soumission | Admin |
| `GET` | `/api/documents/{id}/download/` | URL de téléchargement sécurisée | JWT |
| `GET` | `/api/facultes/` | Structure UCAD complète | — |
| `GET` | `/api/niveaux/` | Liste des niveaux | — |

**Filtres `/api/documents/`** : `?type=`, `?statut=`, `?faculte=<uuid>`, `?filiere=<uuid>`, `?niveau=<uuid>`, `?annee=`, `?search=`

---

## Structure de la base de données

```
User ──────────────┐
  id (UUID)        │
  role (admin|membre)    soumis_par ──→ Document
  faculte (FK)     │         id (UUID)
  filiere (FK)     │         titre, auteur
                   │         type (memoire_licence|master|doctorat|article|rapport)
Faculte            │         statut (en_attente|approuve|rejete)
  id (UUID)        │         faculte (FK) ──→ Faculte
  nom, code        │         filiere (FK) ──→ Filiere
  filieres[] ──────┤         niveau  (FK) ──→ Niveau
                   │         annee, resume, mots_cles[]
Filiere            │         fichier → MinIO (PDF)
  id (UUID)        │         date_soumission, date_approbation
  nom              │
  faculte (FK)     └──── approuve_par ──→ User

Niveau
  id (UUID)
  nom (Licence 1…DIC 3)
  ordre (1–11)
  cycle (LMD|ING)
```

---

## Déploiement VPS (Hostinger KVM 2)

### Démarrage initial

```bash
# Sur le VPS (Ubuntu 22.04)
git clone <url-du-repo>
cd DMN_BU
cp .env.example .env
nano .env   # renseigner DJANGO_SECRET_KEY, DB_PASSWORD, MEILI_MASTER_KEY, MINIO_ROOT_PASSWORD, email

# Lancer tout (migrations, bucket MinIO, index Meilisearch — tout automatique)
docker compose up -d --build
```

### SSL en production (après configuration DNS)

Le domaine doit pointer vers l'IP du VPS **avant** de lancer Certbot.

**Étape 1 — Obtenir le certificat**

```bash
docker compose --profile ssl run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d votre-domaine.com \
  -d www.votre-domaine.com \
  --email votre@email.com \
  --agree-tos \
  --no-eff-email
```

**Étape 2 — Activer HTTPS dans Nginx**

Dans [nginx/nginx.conf](nginx/nginx.conf), remplacer dans le bloc `server { listen 80 }` :

```nginx
# Décommenter cette ligne (redirection HTTP → HTTPS) :
return 301 https://$host$request_uri;
```

Puis décommenter le bloc `server { listen 443 ssl ... }` en bas du fichier et remplacer `votre-domaine.com` par le vrai domaine.

**Étape 3 — Appliquer**

```bash
docker compose restart proxy
```

**Renouvellement automatique** (à planifier via cron sur le VPS)

```bash
# Ajouter dans crontab -e :
0 3 * * * cd /chemin/DMN_BU && docker compose --profile ssl run --rm certbot renew && docker compose restart proxy
```

---

## Variables d'environnement — référence complète

| Variable | Dev | Prod | Description |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | (généré) | **Nouveau** | Clé secrète Django |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | `domaine.com,www.domaine.com` | Hôtes autorisés |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `https://domaine.com` | CORS frontend |
| `DB_PASSWORD` | dev uniquement | **Fort** | PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379/0` | `redis://redis:6379/0` | Cache + Celery |
| `MEILI_MASTER_KEY` | libre | **Aléatoire** | Clé Meilisearch |
| `MEILI_ENV` | `development` | `production` | Mode Meilisearch |
| `MINIO_ROOT_USER` | `minioadmin` | **Changé** | Admin MinIO |
| `MINIO_ROOT_PASSWORD` | `minioadmin123` | **Fort** | Admin MinIO |
| `SEND_REAL_EMAILS` | `False` | `True` | Envoi email SMTP réel |
| `EMAIL_HOST_USER` | — | adresse Gmail | Expéditeur email |
| `EMAIL_HOST_PASSWORD` | — | App Password | Mot de passe applicatif |
| `DEFAULT_FROM_EMAIL` | — | `noreply@budmnucad.sn` | Expéditeur affiché |

---

## Coût d'hébergement

| Poste | Coût |
|---|---|
| VPS Hostinger KVM 2 (2 vCPU, 8 Go RAM) | 7,99 €/mois |
| Nom de domaine (.sn ou .com) | ~0,70 €/mois |
| SSL Let's Encrypt | Gratuit |
| **Total** | **~8,70 €/mois** |
