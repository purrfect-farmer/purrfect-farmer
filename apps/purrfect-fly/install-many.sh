#!/usr/bin/env bash

# Installs several Purrfect Fly instances on one server.
# Usage: install-many.sh [slug] [name] [count] [base-port]
# Defaults: example Example 10 4001 (base-port defaults to the existing install's)
# Instance n lives in ~/<slug>-n, runs as pm2 app <slug>-n, is named "<name> (n)"
# and is reachable at http://<ip>:<base-port + n - 1> through Nginx.
# Safe to re-run: running instances are left as they are, stopped or half-installed
# ones are repaired, and a higher count adds new ones.

set -e

SLUG="${1:-example}"
NAME="${2:-Example}"
COUNT="${3:-10}"
BASE_PORT_ARG="$4"

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

# Set KEY="VALUE" in an env file, adding the line when it is missing
set_env() {
    local file="$1" key="$2" value="$3"

    if grep -q "^$key=" "$file"; then
        sed -i "s|^$key=.*|$key=\"$value\"|" "$file"
    else
        echo "$key=\"$value\"" >> "$file"
    fi
}

# Print a value from an env file without quotes
get_env() {
    grep -E "^$2=" "$1" | cut -d= -f2 | tr -d '"' || true
}

instance_env() {
    echo "$HOME/$SLUG-$1/apps/purrfect-fly/.env"
}

# Print the number of every ~/<slug>-N folder that has a .env, in order
installed_instances() {
    local dir n

    for dir in "$HOME/$SLUG"-*; do
        n="${dir#"$HOME/$SLUG-"}"
        if [[ "$n" =~ ^[0-9]+$ ]] && [ -f "$(instance_env "$n")" ]; then
            echo "$n"
        fi
    done | sort -n
}

# Public port of an installed instance, from its Node port
instance_public_port() {
    echo $(($(get_env "$(instance_env "$1")" PORT) - INTERNAL_PORT_OFFSET))
}

# Base port of an existing install, worked out from its first instance
existing_base_port() {
    local first

    first=$(installed_instances | head -n 1)
    if [ -n "$first" ]; then
        echo $(($(instance_public_port "$first") - first + 1))
    fi
}

# True when the pm2 app is running
is_running() {
    pm2 pid "$1" 2> /dev/null | grep -qE "^[1-9][0-9]*$"
}

BASE_PORT="${BASE_PORT_ARG:-$(existing_base_port)}"
BASE_PORT="${BASE_PORT:-4001}"

public_port() {
    echo $((BASE_PORT + $1 - 1))
}

internal_port() {
    echo $(($(public_port "$1") + INTERNAL_PORT_OFFSET))
}

print_heading "Installing $COUNT instances: $SLUG-1..$SLUG-$COUNT on ports $(public_port 1)-$(public_port "$COUNT")"

print_heading "Installing Nginx web server..."
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
sudo -E apt-get update < /dev/null
sudo -E apt-get upgrade -y < /dev/null
sudo -E apt-get install \
nginx \
git \
curl \
-y < /dev/null


print_heading "Installing Node Version Manager (NVM) and Node.js LTS..."

if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    print_subheading "NVM is not installed. Proceeding with installation..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi

\. "$HOME/.nvm/nvm.sh"

if ! command -v node > /dev/null; then
    nvm install --lts
    npm i -g npm
fi

command -v pnpm > /dev/null || npm i -g pnpm
command -v pm2 > /dev/null || npm i -g pm2


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
    env_file="$(instance_env "$n")"

    if [ -f "$env_file" ] && is_running "$(get_env "$env_file" PM2_APP_NAME)"; then
        print_subheading "[$SLUG-$n] Already running. Skipping."
        continue
    fi

    if [ -f "$env_file" ]; then
        print_heading "[$SLUG-$n] Installed but not running. Repairing..."
        cd "$dir"
    else
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
    fi

    print_heading "[$SLUG-$n] Installing project dependencies..."
    pnpm install

    if [ ! -f "$env_file" ]; then
        print_heading "[$SLUG-$n] Setting up environment variables..."
        cp apps/purrfect-fly/.env.example "$env_file.tmp"
        set_env "$env_file.tmp" PM2_APP_NAME "$SLUG-$n"
        set_env "$env_file.tmp" APP_NAME "$NAME ($n)"
        set_env "$env_file.tmp" PORT "$(internal_port "$n")"
        mv "$env_file.tmp" "$env_file"

        print_subheading "Generating server keys..."
        pnpm -F purrfect-fly fly key:generate
    fi

    print_heading "[$SLUG-$n] Running database migrations and seeders..."
    pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

    print_heading "[$SLUG-$n] Starting with PM2..."
    pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
done

pm2 save


# Every installed instance, including ones above count
mapfile -t INSTANCES < <(installed_instances)

print_heading "Configuring Nginx as a reverse proxy..."
{
    for n in "${INSTANCES[@]}"; do
        cat <<EOF
server {
    listen $(instance_public_port "$n");
    listen [::]:$(instance_public_port "$n");
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
        proxy_pass http://127.0.0.1:$(get_env "$(instance_env "$n")" PORT);
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
    for n in "${INSTANCES[@]}"; do
        sudo ufw allow "$(instance_public_port "$n")/tcp"
    done
fi


print_heading "Server Addresses"
ip=$(curl -4 -s ifconfig.me || true)
for n in "${INSTANCES[@]}"; do
    app_name=$(get_env "$(instance_env "$n")" APP_NAME)
    address="http://${ip:-<your-server-ip>}:$(instance_public_port "$n")"
    print_subheading "$app_name: $address"
done
print_subheading "Now edit each ~/$SLUG-N/apps/purrfect-fly/.env and run: pm2 restart all --update-env"
