#!/bin/bash
# Usage: ./publish_release.sh <GITHUB_USERNAME> <GITHUB_TOKEN>

USER=$1
TOKEN=$2

if [ -z "$USER" ] || [ -z "$TOKEN" ]; then
    echo "Usage: ./publish_release.sh <GITHUB_USERNAME> <GITHUB_TOKEN>"
    exit 1
fi

# Lowercase username for docker image compatibility
USER_LOWER=$(echo "$USER" | tr '[:upper:]' '[:lower:]')

echo "Logging into GitHub Container Registry..."
echo $TOKEN | docker login ghcr.io -u $USER --password-stdin

echo "Tagging images..."
# Assumes images are built locally as smart-erp-api and smart-erp-web
docker tag smart-erp-api:latest ghcr.io/$USER_LOWER/smart-erp-api:latest
docker tag smart-erp-web:latest ghcr.io/$USER_LOWER/smart-erp-web:latest

echo "Pushing images..."
docker push ghcr.io/$USER_LOWER/smart-erp-api:latest
docker push ghcr.io/$USER_LOWER/smart-erp-web:latest

echo "========================================"
echo "SUCCESS! Images are published to GHCR."
echo "========================================"
echo "Users can now start the ERP with:"
echo "curl -O https://raw.githubusercontent.com/$USER/Smart-ERP/main/docker-compose.prod.yml"
echo "docker-compose -f docker-compose.prod.yml up -d"
