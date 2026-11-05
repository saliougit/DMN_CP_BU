# Déploiement DMN_BU (bibliothèque numérique)

Déployé sur le même VPS que DMN-PGI (`164.68.98.73`), dans un dossier et une
stack Docker séparés (`/opt/dmn-bu`), avec son propre nginx (hôte) et son
propre pipeline CI/CD. Contrairement à DMN-PGI (GitLab, deux branches
`develop`/`deploy_backend`), ce projet est sur GitHub et se déploie
entièrement depuis `main` via GitHub Actions
(`.github/workflows/deploy.yml`) - voir [deploy/ci/README.md](ci/README.md)
pour le détail du pipeline et la liste des secrets.

## Architecture

- `bnumerique.dmnucad.com` -> conteneur Next.js (`frontend`) -> `127.0.0.1:3010`
- `api-bnumerique.dmnucad.com` -> Django/Gunicorn (`backend`) -> `127.0.0.1:8010`
- `storage-bnumerique.dmnucad.com` -> MinIO (`storage`) -> `127.0.0.1:9010`

`db`, `redis` et `search` (Meilisearch) ne sont joignables que depuis le
réseau Docker interne (`dmnbu_network`) - aucun port exposé sur l'hôte.

Nginx + HTTPS (Certbot) : même mécanique que DMN-PGI, voir
[../../DMN_DEV/deploy/nginx/README.md](../../DMN_DEV/deploy/nginx/README.md)
pour le détail général (templates de référence vs fichiers réels sous
`/etc/nginx/sites-available/`, ce que fait Certbot, renouvellement).

## Fichiers de production

`.env.production` (racine du repo, backend + build arg frontend) est
entièrement régénéré à chaque déploiement depuis les secrets GitHub Actions
- ne jamais l'éditer à la main sur le VPS, voir
[deploy/ci/README.md](ci/README.md). Référence du format attendu :
[`.env.production.example`](../.env.production.example).

Le frontend n'a pas de `.env.production` séparé : `NEXT_PUBLIC_API_URL` est
un build arg Docker (voir `frontend/Dockerfile`), passé via la même valeur
que `.env.production.generated`.

## Démarrage / état / logs

```bash
cd /opt/dmn-bu
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=100
```

Tests locaux depuis le VPS :

```bash
curl -I http://127.0.0.1:3010   # frontend
curl -I http://127.0.0.1:8010   # backend
curl -I http://127.0.0.1:9010/minio/health/live   # minio
```

## Setup initial (à faire une seule fois)

Rien de tout ceci n'a encore été fait sur le VPS - checklist complète,
dans l'ordre :

### 1. Cloner le repo sur le VPS

```bash
ssh root@164.68.98.73
mkdir -p /opt/dmn-bu && cd /opt/dmn-bu
git clone git@github.com:saliougit/DMN_CP_BU.git .
# ou: git clone https://github.com/saliougit/DMN_CP_BU.git .
git checkout main
```

Le VPS a besoin d'un accès en lecture au repo GitHub (clé de déploiement
GitHub séparée de la clé SSH de déploiement CI, ou dépôt rendu public, ou
token). Si une clé de déploiement GitHub existe déjà sur ce VPS pour un
autre repo, en créer une dédiée (Settings -> Deploy keys du repo
`DMN_CP_BU`, lecture seule suffit).

### 2. Clé SSH dédiée au déploiement CI (GitHub -> VPS)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/dmnbu_deploy -N "" -C "github-actions-dmn-bu"
cat ~/.ssh/dmnbu_deploy.pub >> ~/.ssh/authorized_keys
base64 -w0 ~/.ssh/dmnbu_deploy > ~/dmnbu_deploy_b64.txt   # contenu -> secret GitHub DEPLOY_SSH_PRIVATE_KEY_B64
```

Ne pas réutiliser la clé de DMN-PGI (`DMN_DEV`) : même si c'est le même
VPS, autant isoler les accès par repo. Une ligne de plus dans
`authorized_keys` ne coûte rien.

### 3. DNS (Hostinger) - normalement déjà fait

Vérifier que ces 3 enregistrements `A` existent et pointent vers
`164.68.98.73` :

```bash
nslookup bnumerique.dmnucad.com
nslookup api-bnumerique.dmnucad.com
nslookup storage-bnumerique.dmnucad.com
```

### 4. Vérifier que les ports choisis sont libres sur le VPS

`docker-compose.prod.yml` utilise `3010` (frontend), `8010` (backend),
`9010` (minio) - choisis pour ne pas entrer en collision avec DMN-PGI
(`3000`-`3002`, `8000`, `9000`). Vérifier qu'aucune autre stack du VPS
(`dmn-comptablite-matiere` notamment) ne les utilise déjà :

```bash
ss -tlnp | grep -E ':(3010|8010|9010)\b'
```

Si collision, changer le port concerné dans `docker-compose.prod.yml` (et
dans le fichier nginx correspondant) avant le premier déploiement.

### 5. Créer les fichiers nginx de base

Pour chacun des 3 domaines, reprendre le template correspondant dans
[deploy/nginx/](nginx/) de ce repo (juste le bloc HTTP, sans HTTPS -
Certbot s'en charge à l'étape suivante) :

```bash
cp deploy/nginx/bnumerique.dmnucad.com.conf /etc/nginx/sites-available/bnumerique.dmnucad.com
cp deploy/nginx/api-bnumerique.dmnucad.com.conf /etc/nginx/sites-available/api-bnumerique.dmnucad.com
cp deploy/nginx/storage-bnumerique.dmnucad.com.conf /etc/nginx/sites-available/storage-bnumerique.dmnucad.com

ln -s /etc/nginx/sites-available/bnumerique.dmnucad.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/api-bnumerique.dmnucad.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/storage-bnumerique.dmnucad.com /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

### 6. Premier démarrage (avant Certbot - doit répondre en HTTP)

Créer `.env.production` à la main pour cette toute première fois
seulement (ensuite le pipeline le régénère à chaque déploiement) en
copiant [.env.production.example](../.env.production.example) et en
remplissant les vraies valeurs, puis :

```bash
cd /opt/dmn-bu
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
curl -I http://127.0.0.1:3010
curl -I http://127.0.0.1:8010
curl -I http://127.0.0.1:9010/minio/health/live
```

### 7. Certificat HTTPS

Nouveau certificat dédié à ces 3 domaines (séparé de celui de DMN-PGI,
puisque c'est un sous-ensemble de domaines différent) :

```bash
certbot --nginx \
  -d bnumerique.dmnucad.com \
  -d api-bnumerique.dmnucad.com \
  -d storage-bnumerique.dmnucad.com
```

Certbot modifie automatiquement les 3 fichiers nginx (ajoute le bloc HTTPS
+ la redirection HTTP->HTTPS) et recharge nginx tout seul.

### 8. Vérifier de bout en bout

```bash
curl -I https://bnumerique.dmnucad.com
curl -I https://api-bnumerique.dmnucad.com
curl -I https://storage-bnumerique.dmnucad.com/minio/health/live
```

### 9. Secrets GitHub Actions

Voir [deploy/ci/README.md](ci/README.md) pour la liste exacte et comment
les ajouter (Settings -> Secrets and variables -> Actions, sur le repo
GitHub `DMN_CP_BU`).

### 10. Premier déploiement via le pipeline

Un push sur `main` (ou "Run workflow" manuel sur
`.github/workflows/deploy.yml`) déclenche le pipeline complet. Suivre
l'avancement dans GitHub -> Actions.

## Dépannage

- **Le job `*-validate` échoue** : erreur de code (check Django, build
  Next.js) - corriger avant de re-pousser.
- **Le job `deploy-*` échoue à la connexion SSH** : vérifier que le secret
  `DEPLOY_SSH_PRIVATE_KEY_B64` est bien défini et que la clé publique
  correspondante est dans `~/.ssh/authorized_keys` sur le VPS.
- **Le déploiement réussit mais le service ne répond pas** :
  ```bash
  ssh root@164.68.98.73
  cd /opt/dmn-bu
  docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 backend celery frontend storage
  ```
- **Une variable d'environnement semble manquante/fausse** : comparer
  `cat /opt/dmn-bu/.env.production` (sur le VPS) avec le heredoc dans
  `.github/workflows/deploy.yml` et les secrets GitHub.
