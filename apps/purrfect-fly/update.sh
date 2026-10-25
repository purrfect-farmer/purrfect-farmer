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
if [ -n "$TERMUX_VERSION" ]; then
    # Other apps pull deps that may not build on Android
    pnpm install --filter "purrfect-fly..."
else
    pnpm install
fi

print_heading "Running database migrations and seeders..."
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

# Check if --no-restart flag is provided
if [[ "$*" != *"--no-restart"* ]]; then
    print_heading "Restarting Purrfect Fly with PM2..."
    pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
    pm2 save
else
    print_subheading "Skipping PM2 restart (--no-restart flag specified)"
fi


# Print the public port of the Nginx server block that proxies to the given Node port
find_public_port() {
    local target="//127.0.0.1:$1;"

    awk -v target="$target" '
        $1 == "server" { listen = "" }
        $1 == "listen" && listen == "" && $2 ~ /^[0-9]+;?$/ { listen = $2; sub(";", "", listen) }
        $1 == "proxy_pass" && index($2, target) && listen != "" { print listen; exit }
    ' /etc/nginx/sites-enabled/* 2> /dev/null
}

print_heading "Server Address"
node_port=$(grep -E "^PORT=" apps/purrfect-fly/.env | cut -d= -f2 | tr -d '"')
node_port=${node_port:-4000}
public_port=$(find_public_port "$node_port")

if [ -n "$public_port" ]; then
    ip=$(curl -s ifconfig.me)
    print_subheading "You can access Purrfect Fly at: http://$ip:$public_port"
else
    print_subheading "Purrfect Fly is running on port $node_port (no Nginx site found for it)"
fi
