# Stack Technique — DMN BU (Bibliothèque Universitaire Numérique Mouride)

## Contexte du projet

Plateforme de gestion et de consultation de mémoires, licences et thèses pour une organisation religieuse mouride. Inspirée des bibliothèques universitaires numériques (ex. bibnum.ucad.sn).

### Fonctionnalités principales

- **Admins** : gestion complète des documents (classification par niveau, faculté, année, auteur), approbation/rejet des soumissions, gestion des membres
- **Membres** : recherche multi-critères, prévisualisation et téléchargement, soumission de leurs propres travaux
- **Workflow** : soumission → vérification admin → approbation/rejet → classement

---

## Infrastructure

### Hébergement VPS

**Hostinger KVM 2**

| Caractéristique | Valeur |
|---|---|
| vCPU | 2 cœurs |
| RAM | 8 Go |
| Stockage | 100 Go NVMe |
| Bande passante | 8 To/mois |
| Prix | 7,99 €/mois (renouvellement 14,99 €/mois) |

> Choix justifié : 5 services Docker tournent en parallèle (frontend, backend, base de données, moteur de recherche, stockage). 8 Go de RAM offre un confort suffisant au lancement avec de la marge pour la croissance.

### Nom de domaine

| Option | Registrar | Prix estimé |
|---|---|---|
| `.com` ou `.org` | [Porkbun](https://porkbun.com) | ~8–10 $/an |
| `.sn` (Sénégal) | OVH ou NIC Sénégal | ~15 000 FCFA/an |

**DNS** : Cloudflare (gratuit) — protection DDoS, cache, SSL automatique

---

## Stack technique

### Vue d'ensemble

```
VPS Hostinger (Ubuntu 22.04 + Docker Compose)
├── Next.js          → Frontend (interface publique + espace membre)
├── Django REST API  → Backend (logique métier, workflow, auth)
├── PostgreSQL       → Base de données principale
├── Meilisearch      → Moteur de recherche des documents
└── MinIO            → Stockage des fichiers (PDFs, documents)
```

---

### Frontend — Next.js (React + TypeScript)

- **Framework** : [Next.js](https://nextjs.org/) 14+
- **Langage** : TypeScript
- **Rendu** : SSR (Server-Side Rendering) pour le SEO et les pages publiques
- **Prévisualisation PDF** : `react-pdf` (basé sur PDF.js de Mozilla)
- **Upload de fichiers** : upload progressif avec barre de progression
- **Hébergement** : container Docker sur le VPS (pas de Vercel)

---

### Backend — Django + Django REST Framework (Python)

- **Framework** : [Django](https://www.djangoproject.com/) 5+ avec [Django REST Framework](https://www.django-rest-framework.org/)
- **Langage** : Python 3.12+
- **Pourquoi Django** :
  - Admin panel intégré → utilisable directement par les admins pour la gestion
  - ORM puissant pour modéliser la classification (niveau, faculté, année…)
  - Gestion des rôles et permissions native
  - Librairies PDF : `pdfplumber`, `PyPDF2` (extraction automatique de métadonnées)
- **Authentification** : JWT via `djangorestframework-simplejwt`
- **Rôles** : `admin`, `membre`, `visiteur`

---

### Base de données — PostgreSQL

- **Version** : PostgreSQL 16
- **Pourquoi PostgreSQL** :
  - Full-text search en français intégré (backup si Meilisearch est indisponible)
  - Extensions utiles : `pg_trgm` (recherche floue), `unaccent` (insensible aux accents)
  - Robuste, open-source, standard de l'industrie
- **Stockage** : volume Docker persistant sur le NVMe du VPS

---

### Moteur de recherche — Meilisearch

- **Version** : dernière stable
- **Pourquoi Meilisearch** :
  - Recherche instantanée tolérante aux fautes de frappe
  - Multi-critères : titre, auteur, année, faculté, niveau, mots-clés
  - Open-source, léger, facile à déployer en Docker
  - Indexation automatique à chaque approbation d'un document
- **Alternative** : full-text search PostgreSQL si on veut minimiser les services

---

### Stockage des fichiers — MinIO

- **Pourquoi MinIO** :
  - Self-hosted sur le VPS (tous les fichiers restent sur votre serveur)
  - API compatible S3 → Django l'appelle comme un service cloud standard
  - Interface web d'administration incluse
  - Open-source, gratuit
- **Données stockées** : PDFs des mémoires/thèses, pièces jointes, miniatures de couverture

---

### Déploiement — Docker Compose

Tous les services sont orchestrés via un seul fichier `docker-compose.yml` :

```
services:
  frontend      (Next.js)          → port 3000
  backend       (Django)           → port 8000
  db            (PostgreSQL)       → port 5432
  search        (Meilisearch)      → port 7700
  storage       (MinIO)            → port 9000 / 9001 (console)
  reverse-proxy (Nginx ou Traefik) → port 80/443 (SSL)
```

**SSL** : Certbot (Let's Encrypt) — certificat HTTPS gratuit

---

## Estimation des ressources

| Service | RAM estimée |
|---|---|
| Next.js | ~200–300 Mo |
| Django | ~200–400 Mo |
| PostgreSQL | ~200–500 Mo |
| Meilisearch | ~200–500 Mo |
| MinIO | ~100–200 Mo |
| Nginx + overhead Docker | ~200 Mo |
| **Total** | **~1,1–2,1 Go** |

→ Le KVM 2 (8 Go RAM) laisse une marge confortable.

---

## Résumé des coûts mensuels

| Poste | Coût |
|---|---|
| VPS Hostinger KVM 2 | 7,99 €/mois |
| Nom de domaine | ~0,70 €/mois (8 $/an) |
| SSL (Let's Encrypt) | Gratuit |
| Stockage fichiers (MinIO local) | Inclus dans le VPS |
| **Total** | **~8,70 €/mois** |

---

## Prochaines étapes

- [ ] Modélisation de la base de données (entités : Document, Membre, Faculté, Niveau, Workflow)
- [ ] Définition des rôles et permissions
- [ ] Maquettes des interfaces (recherche, soumission, admin)
- [ ] Mise en place de l'environnement Docker de développement
- [ ] Développement du backend (API Django)
- [ ] Développement du frontend (Next.js)
- [ ] Déploiement sur VPS
