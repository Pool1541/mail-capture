#!/bin/bash
set -a
source .env
set +a

docker network create traefik 2> /dev/null || true

echo "Construyendo imágenes de producción..."
docker compose --project-directory . -f infra/docker/prod/docker-compose.yml build

if [ $? -ne 0 ]; then
  echo "Error: El build falló"
  exit 1
fi
echo "Build completado exitosamente!"

echo "Iniciando Traefik..."
docker compose --project-directory . -f infra/docker/prod/traefik.yml up -d

echo "Esperando a que Traefik esté listo..."
until [ "$(docker inspect traefik --format='{{.State.Health.Status}}' 2>/dev/null)" == "healthy" ]; do
  echo "Traefik aún no está listo, esperando..."
  sleep 2
done
echo "Traefik está listo!"

docker compose --project-directory . -f infra/docker/prod/docker-compose.yml up -d