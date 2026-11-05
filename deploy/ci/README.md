# CI/CD DMN_BU — GitHub Actions

Un seul pipeline (`.github/workflows/deploy.yml`), déclenché sur push vers
`main` (ou manuellement via "Run workflow"). Contrairement à DMN-PGI
(GitLab, backend et frontend séparés sur deux branches), ici tout part de
`main` : le job `changes` détecte quels dossiers (`backend/**`,
`frontend/**`) ont changé et ne valide/déploie que ce qui est concerné.

Jobs, dans l'ordre : `changes` -> `backend-validate` / `frontend-validate`
(en parallèle) -> `deploy-backend` -> `deploy-frontend` (le frontend
attend que le backend ait fini pour éviter deux `git reset --hard`
concurrents sur le même clone côté VPS).

## Secrets GitHub obligatoires

**Settings -> Secrets and variables -> Actions -> New repository secret**,
sur le repo `saliougit/DMN_CP_BU` :

| Secret GitHub | Correspond à | D'où ça vient |
|---|---|---|
| `DEPLOY_SSH_PRIVATE_KEY_B64` | Clé privée SSH dédiée, encodée en Base64 sur une ligne | Générée lors du setup initial - voir [deploy/README.md](../README.md) §2 |
| `DJANGO_SECRET_KEY` | `DJANGO_SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `DB_NAME` | `DB_NAME` | Au choix (ex: `dmn_bu`) |
| `DB_USER` | `DB_USER` | Au choix (ex: `dmn_bu`) |
| `DB_PASSWORD` | `DB_PASSWORD` | Mot de passe fort généré |
| `MEILI_MASTER_KEY` | `MEILI_MASTER_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `EMAIL_HOST_USER` | `EMAIL_HOST_USER` | `contacts@dmnucad.com` |
| `EMAIL_HOST_PASSWORD` | `EMAIL_HOST_PASSWORD` | Mot de passe de la boîte `contacts@dmnucad.com` (hPanel Hostinger -> Emails) |
| `DEFAULT_FROM_EMAIL` | `DEFAULT_FROM_EMAIL` | ex: `DMN Bibliothèque Numérique <contacts@dmnucad.com>` |
| `MINIO_ROOT_USER` | `MINIO_ROOT_USER` | Au choix (nouveau, MinIO jamais déployé pour ce projet) |
| `MINIO_ROOT_PASSWORD` | `MINIO_ROOT_PASSWORD` | Mot de passe fort généré |

Les valeurs non sensibles (domaines, ports, `MINIO_BUCKET`,
`MINIO_ENDPOINT`...) sont écrites en dur dans
`.github/workflows/deploy.yml` (bloc `env:` en tête de fichier pour
host/port/user/path de déploiement, heredoc `env.production.generated`
pour le reste) - pas besoin de secret pour ça.

Tant que `DEPLOY_SSH_PRIVATE_KEY_B64` n'est pas défini, `backend-validate`
et `frontend-validate` fonctionnent mais les jobs `deploy-*` échoueront à
la connexion SSH (normal, rien n'est encore configuré côté VPS).

## Config email (identique à DMN-PGI, boîte différente)

`smtp.hostinger.com`, port `465`, `EMAIL_USE_SSL=True` /
`EMAIL_USE_TLS=False` (SSL implicite, pas STARTTLS) - voir
`backend/dmn_bu/settings/base.py`. DMN-PGI utilise `noreply@dmnucad.com`,
ce projet utilise `contacts@dmnucad.com` : boîtes différentes, même
serveur SMTP Hostinger, même réglages de port/chiffrement. Si le port 465
est bloqué en sortie du VPS (déjà arrivé en dev avec Gmail), basculer sur
`EMAIL_PORT=587` / `EMAIL_USE_TLS=True` / `EMAIL_USE_SSL=False` dans le
heredoc du workflow.

## Ajouter une nouvelle variable d'environnement

1. Secret (mot de passe, clé) -> GitHub Secret + ligne dans le heredoc de
   `.github/workflows/deploy.yml` (`deploy-backend`) :
   `MA_VARIABLE=${{ secrets.MA_VARIABLE }}`.
2. Pas secret -> ligne en dur directement dans le même heredoc.
3. Mettre à jour `backend/dmn_bu/settings/base.py` ou `production.py`
   (`config("MA_VARIABLE", ...)`, via `python-decouple`).
4. Mettre à jour [`.env.production.example`](../../.env.production.example)
   à la racine du repo pour garder le format documenté.
5. Commit sur `main` - le prochain déploiement embarque la variable, pas
   besoin de se reconnecter au VPS.

## Sécurité et concurrence

- `.env.production` : régénéré à chaque déploiement depuis les secrets
  GitHub Actions (source de vérité), transmis au VPS par `scp` sur la
  connexion SSH du job `deploy-backend`.
- `concurrency: group: dmnbu-production` (en tête du workflow) empêche
  deux runs de se chevaucher sur `/opt/dmn-bu`.
- `deploy-frontend` dépend explicitement de `deploy-backend` (même motif :
  éviter deux `git reset --hard` concurrents sur le même clone).
