# DMN-BU — Bibliothèque Numérique du Daara Madjmahoun Noreyni

Plateforme de gestion et de consultation des travaux académiques des membres du **Daara Madjmahoun Noreyni (UCAD, Dakar)** — mémoires de licence, mémoires de master, thèses de doctorat et articles de recherche, classés par faculté, filière, niveau et année.

---

## Fonctionnalités

| Profil | Accès |
|---|---|
| **Visiteur** | Recherche, consultation et téléchargement des documents publiés |
| **Membre** | Idem + soumission de ses propres travaux, suivi du statut |
| **Admin** | Gestion complète : approbation/rejet, upload direct, arborescence UCAD, gestion des membres |

**Workflow de publication :** soumission membre → vérification admin → approbation/rejet → classement automatique dans l'arborescence

---

## Stack technique

```
VPS Hostinger KVM 2 (Ubuntu 22.04 · Docker Compose)
├── Next.js 16       → Frontend (App Router, TypeScript, Tailwind v4)
├── Django 6 + DRF   → API REST (logique métier, auth JWT, workflow)
├── PostgreSQL 16    → Base de données principale
├── Meilisearch      → Moteur de recherche full-text
├── MinIO            → Stockage des PDFs (API S3 self-hosted)
└── Nginx            → Reverse proxy + SSL (Let's Encrypt)
```

---

## Arborescence du projet

```
DMN_BU/
│
├── docker-compose.yml          # Orchestration des 6 services Docker
├── .env.example                # Modèle de variables d'environnement
├── STACK.md                    # Documentation technique détaillée
│
├── nginx/
│   └── nginx.conf              # Reverse proxy : /api → Django, / → Next.js
│
├── frontend/                   # Application Next.js (App Router)
│   ├── public/                 # Assets statiques (logo, images)
│   └── src/
│       ├── app/
│       │   ├── (public)/       # Pages accessibles sans connexion
│       │   │   ├── page.tsx            → Accueil (hero + recherche + présentation)
│       │   │   ├── recherche/          → Recherche multi-critères + filtres
│       │   │   ├── documents/[id]/     → Détail + prévisualisation PDF
│       │   │   └── soumettre/          → Formulaire de soumission public
│       │   ├── (auth)/         # Connexion, inscription, mot de passe
│       │   ├── (membre)/       # Espace membre (profil, mes documents)
│       │   └── admin/          # Tableau de bord administrateur
│       │       ├── page.tsx            → Dashboard (stats, soumissions récentes)
│       │       ├── documents/          → Catalogue complet (liste + édition)
│       │       ├── classification/     → Arborescence UCAD (vue lecture seule)
│       │       ├── soumissions/        → File d'approbation des soumissions
│       │       └── membres/            → Gestion des membres
│       ├── components/
│       │   ├── admin/          # Sidebar, arbre de classification, drawer détail
│       │   ├── auth/           # Guard d'authentification
│       │   ├── documents/      # Prévisualisation PDF (react-pdf)
│       │   ├── layout/         # Navbar, Footer, widget Contact, ThemeToggle
│       │   ├── search/         # Barre de recherche hero
│       │   └── ui/             # Composants shadcn/ui (Button, Select, Badge…)
│       ├── contexts/
│       │   └── auth-context.tsx        → Contexte JWT (login, logout, user)
│       ├── lib/
│       │   ├── api.ts                  → Client HTTP (fetch vers Django)
│       │   ├── mock-data.ts            → Données de développement (UCAD structure)
│       │   └── document-types.ts       → Labels et couleurs des types de docs
│       └── types/
│           └── index.ts                → Types TypeScript partagés
│
└── backend/                    # Application Django
    ├── Dockerfile
    ├── requirements.txt        # Dépendances Python
    ├── manage.py               # CLI Django (pointe vers settings.development)
    ├── scripts/
    │   └── entrypoint.sh       # Attente DB + migrate + collectstatic + gunicorn
    ├── dmn_bu/                 # Package principal du projet Django
    │   ├── urls.py             # Routeur racine → /api/...
    │   ├── wsgi.py             # Point d'entrée WSGI (production)
    │   ├── asgi.py             # Point d'entrée ASGI
    │   └── settings/
    │       ├── base.py         # Config commune (DB, DRF, JWT, CORS, MinIO, Meili)
    │       ├── development.py  # DEBUG=True, stockage fichiers local
    │       └── production.py   # Sécurité HTTPS, stockage MinIO (S3)
    └── apps/
        ├── accounts/           # Utilisateurs et authentification
        │   ├── models.py       → User (AbstractUser + rôle admin/membre)
        │   ├── serializers.py  → UserSerializer, RegisterSerializer
        │   ├── views.py        → RegisterView, ProfileView
        │   └── urls.py         → /api/auth/token/, /api/auth/register/, /api/auth/me/
        ├── classification/     # Structure UCAD (lecture seule)
        │   ├── models.py       → Faculte, Filiere, Niveau
        │   ├── serializers.py  → FaculteSerializer (avec filieres), NiveauSerializer
        │   ├── views.py        → FaculteViewSet, NiveauViewSet (ReadOnly)
        │   └── urls.py         → /api/facultes/, /api/niveaux/
        └── documents/          # Cœur métier : documents et workflow
            ├── models.py       → Document (type, statut, FK classification, fichier…)
            ├── serializers.py  → DocumentListSerializer, DetailSerializer, SoumissionSerializer
            ├── views.py        → DocumentViewSet + actions approuver/rejeter/download
            ├── filters.py      → Filtres DRF (faculte, filiere, niveau, annee, type)
            └── urls.py         → /api/documents/ + /api/documents/{id}/approuver|rejeter/
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
# Éditer .env et renseigner les mots de passe
```

Variables obligatoires à modifier dans `.env` :

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Clé secrète Django (générer avec `python -c "import secrets; print(secrets.token_hex(50))"`) |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `MEILI_MASTER_KEY` | Clé Meilisearch |
| `MINIO_ROOT_PASSWORD` | Mot de passe MinIO |

### 3. Lancer tous les services

```bash
docker compose up --build
```

L'application est disponible sur `http://localhost`.

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost |
| API Django | http://localhost/api/ |
| Admin Django | http://localhost/admin/ |
| Console MinIO | http://localhost:9001 |

---

## Développement local (sans Docker)

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
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver    # http://localhost:8000
```

> Le backend en développement utilise PostgreSQL via Docker. Lancer `docker compose up db search storage` pour démarrer uniquement les services tiers.

---

## API — Principaux endpoints

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/token/` | Connexion → JWT access + refresh | — |
| `POST` | `/api/auth/token/refresh/` | Renouveler le token | — |
| `POST` | `/api/auth/register/` | Créer un compte membre | — |
| `GET` | `/api/auth/me/` | Profil de l'utilisateur connecté | JWT |
| `GET` | `/api/documents/` | Liste des documents (filtrés, paginés) | — |
| `POST` | `/api/documents/` | Soumettre un document | JWT |
| `GET` | `/api/documents/{id}/` | Détail d'un document | — |
| `POST` | `/api/documents/{id}/approuver/` | Approuver une soumission | Admin |
| `POST` | `/api/documents/{id}/rejeter/` | Rejeter une soumission | Admin |
| `GET` | `/api/documents/{id}/download/` | URL de téléchargement | JWT |
| `GET` | `/api/facultes/` | Structure UCAD complète | — |
| `GET` | `/api/niveaux/` | Liste des niveaux | — |

**Paramètres de filtre pour `/api/documents/`** : `?type=`, `?statut=`, `?faculte=<uuid>`, `?filiere=<uuid>`, `?niveau=<uuid>`, `?annee=`, `?search=`

---

## Structure de la base de données

```
User ──────────────┐
  id (UUID)        │
  username         │
  role (admin|membre)    soumis_par ──→ Document
  faculte (FK)     │         id (UUID)
  filiere (FK)     │         titre
                   │         auteur
Faculte            │         type (memoire_licence|master|doctorat|article|rapport)
  id (UUID)        │         statut (en_attente|approuve|rejete)
  nom              │         faculte (FK) ──→ Faculte
  code (FST, ESP…) │         filiere (FK) ──→ Filiere
  filieres[] ──────┤         niveau  (FK) ──→ Niveau
                   │         annee
Filiere            │         fichier (MinIO)
  id (UUID)        │         mots_cles[]
  nom              │         date_soumission
  faculte (FK)     │         date_approbation
                   │
Niveau             └──── approuve_par ──→ User
  id (UUID)
  nom (Licence 1…DIC 3)
  ordre (1–11)
  cycle (LMD|ING)
```

---

## Déploiement VPS (Hostinger KVM 2)

```bash
# Sur le VPS (Ubuntu 22.04)
git clone <url-du-repo>
cd DMN_BU
cp .env.example .env && nano .env   # renseigner les variables de prod

# Démarrer
docker compose up -d --build

# SSL avec Certbot (après config DNS)
docker exec proxy certbot --nginx -d votre-domaine.com
```

---

## Coût d'hébergement

| Poste | Coût |
|---|---|
| VPS Hostinger KVM 2 (2 vCPU, 8 Go RAM) | 7,99 €/mois |
| Nom de domaine (.com ou .sn) | ~0,70 €/mois |
| SSL Let's Encrypt | Gratuit |
| **Total** | **~8,70 €/mois** |
