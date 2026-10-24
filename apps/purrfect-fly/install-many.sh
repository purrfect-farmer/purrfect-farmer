#!/usr/bin/env bash

# Installs several Purrfect Fly instances on one server.
# Usage: install-many.sh [slug] [name] [count] [base-port]
# Defaults: example Example 10 4001
# Instance n lives in ~/<slug>-n, runs as pm2 app <slug>-n, is named "<name> (n)"
# and is reachable at http://<ip>:<base-port + n - 1> through Nginx.

set -e

SLUG="${1:-example}"
NAME="${2:-Example}"
COUNT="${3:-10}"
BASE_PORT="${4:-4001}"

# Node listens on this offset from the public port, Nginx owns the public one
INTERNAL_PORT_OFFSET=10000

REPO_URL="https://github.com/purrfect-farmer/purrfect-farmer.git"
NGINX_SITE="purrfect-fly-$SLUG"

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

# Set KEY="VALUE" in the instance .env file
set_env() {
    sed -i "s|^$1=.*|$1=\"$2\"|" apps/purrfect-fly/.env
}

public_port() {
    echo $((BASE_PORT + $1 - 1))
}

internal_port() {
    echo $(($(public_port "$1") + INTERNAL_PORT_OFFSET))
}

print_heading "Installing $COUNT instances: $SLUG-1..$SLUG-$COUNT on ports $(public_port 1)-$(public_port "$COUNT")"

print_heading "Installing Nginx web server..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install \
nginx \
git \
curl \
-y


print_heading "Installing Node Version Manager (NVM) and Node.js LTS..."

if [ -d "$HOME/.nvm" ]; then
    print_subheading "NVM is already installed."
    \. "$HOME/.nvm/nvm.sh"
else
    print_subheading "NVM is not installed. Proceeding with installation..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

    \. "$HOME/.nvm/nvm.sh"

    nvm install --lts

    npm i -g npm
    npm i -g pnpm
    npm i -g pm2
fi


print_heading "Setting up PM2 to run on startup..."
startup_command=$(pm2 startup | grep "sudo env" | sed 's/^[[:space:]]*//' || true)
if [ -n "$startup_command" ]; then
    print_subheading "Executing PM2 startup command..."
    eval "$startup_command"
else
    print_subheading "PM2 startup already configured or command not found."
fi


for n in $(seq 1 "$COUNT"); do
    dir="$HOME/$SLUG-$n"

    print_heading "[$SLUG-$n] Setting up repository in $dir..."
    if [ -d "$dir/.git" ]; then
        print_subheading "Repository already exists. Pulling latest changes..."
        cd "$dir"
        git pull origin main
    else
        print_subheading "Cloning Purrfect Farmer repository..."
        git clone "$REPO_URL" "$dir"
        cd "$dir"
    fi

    print_heading "[$SLUG-$n] Installing project dependencies..."
    pnpm install

    print_heading "[$SLUG-$n] Setting up environment variables..."
    if [ ! -f apps/purrfect-fly/.env ]; then
        print_subheading ".env file not found. Creating from .env.example..."
        cp apps/purrfect-fly/.env.example apps/purrfect-fly/.env

        print_subheading "Generating server keys..."
        pnpm -F purrfect-fly fly key:generate

        set_env PM2_APP_NAME "$SLUG-$n"
        set_env APP_NAME "$NAME ($n)"
        set_env PORT "$(internal_port "$n")"
    else
        print_subheading ".env file already exists. Skipping setup."
    fi

    print_heading "[$SLUG-$n] Running database migrations and seeders..."
    pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

    print_heading "[$SLUG-$n] Starting with PM2..."
    pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
done

pm2 save


print_heading "Configuring Nginx as a reverse proxy..."
{
    for n in $(seq 1 "$COUNT"); do
        cat <<EOF
server {
    listen $(public_port "$n");
    listen [::]:$(public_port "$n");
    server_name _;

    location / {
        proxy_http_version 1.1;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass http://127.0.0.1:$(internal_port "$n");
    }
}

EOF
    done
} | sudo tee "/etc/nginx/sites-available/$NGINX_SITE" > /dev/null

print_heading "Enabling Nginx site configuration..."
sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"

print_heading "Testing and reloading Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

if command -v ufw > /dev/null && sudo ufw status | grep -q "Status: active"; then
    print_heading "Opening ports in UFW..."
    sudo ufw allow "$(public_port 1):$(public_port "$COUNT")/tcp"
fi


print_heading "Server Addresses"
ip=$(curl -s ifconfig.me)
for n in $(seq 1 "$COUNT"); do
    print_subheading "$NAME ($n): http://$ip:$(public_port "$n")"
done
print_subheading "Now edit each ~/$SLUG-N/apps/purrfect-fly/.env and run: pm2 restart all --update-env"
