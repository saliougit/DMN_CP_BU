#!/usr/bin/env bash
# Appelé depuis .github/workflows/deploy.yml (jobs deploy-backend /
# deploy-frontend), sur le VPS, une fois le code mis à jour (git reset --hard).
set -Eeuo pipefail

SERVICE="${1:-}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

if [[ -z "$SERVICE" ]]; then
  echo "Usage: $0 {backend|frontend}"
  exit 2
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fichier $ENV_FILE introuvable dans $(pwd)"
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

wait_http() {
  local url="$1"
  local label="$2"
  local host_header="${3:-}"
  # ALLOWED_HOSTS (Django) n'inclut jamais 127.0.0.1 - un curl direct sur
  # l'IP loopback recoit systematiquement 400 DisallowedHost, quel que soit
  # le temps d'attente. $host_header force le vrai domaine via -H, sans
  # avoir a assouplir ALLOWED_HOSTS juste pour ce controle interne.
  local -a curl_opts=(-fsS -o /dev/null -I)
  if [[ -n "$host_header" ]]; then
    curl_opts+=(-H "Host: $host_header")
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl absent: contrôle HTTP de $label ignoré."
    return 0
  fi

  echo "Vérification de $label sur $url ..."
  for _ in {1..20}; do
    if curl "${curl_opts[@]}" "$url"; then
      echo "$label répond correctement."
      return 0
    fi
    sleep 2
  done

  echo "$label ne répond pas après 40 secondes."
  compose ps
  return 1
}

case "$SERVICE" in
  backend)
    echo "Infra (db/redis/search/minio) - demarre seulement ce qui n'est pas deja en route..."
    compose up -d db redis search storage storage-init
    echo "Déploiement API + Celery worker..."
    compose build --pull backend celery
    compose up -d --no-deps backend celery
    wait_http "http://127.0.0.1:8010/admin/" "API" "api-bnumerique.dmnucad.com"
    compose ps db redis search storage backend celery
    ;;

  frontend)
    echo "Déploiement du frontend..."
    compose build --pull frontend
    compose up -d --no-deps frontend
    wait_http "http://127.0.0.1:3010" "Frontend"
    compose ps frontend
    ;;

  *)
    echo "Service inconnu: $SERVICE"
    exit 2
    ;;
esac

echo "Déploiement $SERVICE terminé."
