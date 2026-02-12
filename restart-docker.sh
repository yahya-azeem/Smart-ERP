#!/bin/bash

# Smart ERP Docker Restart Script
# This script will rebuild and restart all containers with the latest changes

echo "================================"
echo "Smart ERP Docker Restart"
echo "================================"
echo ""

echo "1. Stopping existing containers..."
docker-compose down

echo ""
echo "2. Removing old images (optional, for fresh build)..."
read -p "Do you want to rebuild images from scratch? (y/n): " rebuild

if [ "$rebuild" = "y" ] || [ "$rebuild" = "Y" ]; then
    echo "Removing old images..."
    docker-compose down --rmi local
    echo "Building fresh images..."
    docker-compose build --no-cache
else
    echo "Using existing images..."
fi

echo ""
echo "3. Starting containers..."
docker-compose up -d

echo ""
echo "4. Waiting for services to start..."
sleep 5

echo ""
echo "5. Checking container status..."
docker-compose ps

echo ""
echo "================================"
echo "Services should be starting up!"
echo "================================"
echo ""
echo "Access your application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8000"
echo ""
echo "To view logs, run:"
echo "  docker-compose logs -f"
echo ""
echo "To stop, run:"
echo "  docker-compose down"
