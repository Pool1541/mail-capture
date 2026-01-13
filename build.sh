#!/bin/bash
set -a
source .env.development
set +a

docker build \
  --build-arg NGROK_AUTH_TOKEN="$NGROK_AUTH_TOKEN" \
  -t $DOCKER_IMAGE . && \
  docker run -d \
  --name $DOCKER_CONTAINER_NAME \
  --env-file .env.development \
  -p 3000:8080 \
  $DOCKER_IMAGE
