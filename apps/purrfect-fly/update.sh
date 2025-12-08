#!/usr/bin/env bash

# Colors
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored heading
print_heading() {
    echo -e "${GREEN}$1${NC}"
}

# Print colored subheading
print_subheading() {
    echo -e "${YELLOW}$1${NC}"
}

print_heading "Updating Purrfect Farmer repository..."
git pull origin main

print_heading "Installing project dependencies..."
pnpm install

print_heading "Running database migrations and seeders..."
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

print_heading "Restarting Purrfect Fly with PM2..."
pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
pm2 save


print_heading "Server Address"
ip=$(curl ifconfig.me)
print_subheading "You can access Purrfect Fly at: http://$ip"