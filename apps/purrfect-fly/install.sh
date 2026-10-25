#!/usr/bin/env bash

# Nginx owns the public port and proxies to Node on the port 10000 higher
PUBLIC_PORT=4000
INTERNAL_PORT=$((PUBLIC_PORT + 10000))
NGINX_SITE_PATH="/etc/nginx/sites-available/purrfect-fly"

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

print_heading "Installing Nginx web server..."
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
sudo -E apt-get update < /dev/null
sudo -E apt-get upgrade -y < /dev/null
sudo -E apt-get install \
nginx \
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
startup_command=$(pm2 startup | grep "sudo env" | sed 's/^[[:space:]]*//')
if [ -n "$startup_command" ]; then
    print_subheading "Executing PM2 startup command..."
    eval "$startup_command"
else
    print_subheading "PM2 startup already configured or command not found."
fi

print_heading "Setting up Purrfect Farmer repository..."
if [ -d "$HOME/purrfect-farmer/.git" ]; then
    print_subheading "Repository already exists. Pulling latest changes..."
    cd ~/purrfect-farmer
    git pull origin main
else
    print_subheading "Cloning Purrfect Farmer repository..."
    git clone https://github.com/purrfect-farmer/purrfect-farmer.git ~/purrfect-farmer
    cd ~/purrfect-farmer
fi

print_heading "Installing project dependencies..."
pnpm install

print_heading "Setting up environment variables..."
if [ ! -f apps/purrfect-fly/.env ]; then
    print_subheading ".env file not found. Creating from .env.example..."
    cp apps/purrfect-fly/.env.example apps/purrfect-fly/.env
    
    print_subheading "Generating server keys..."
    pnpm -F purrfect-fly fly key:generate

    sed -i "s|^PORT=.*|PORT=$INTERNAL_PORT|" apps/purrfect-fly/.env
else
    print_subheading ".env file already exists. Skipping setup."
fi

# Nginx takes the public port, so a new site needs Node off it
env_port=$(grep -E "^PORT=" apps/purrfect-fly/.env | cut -d= -f2 | tr -d '"')
if [ ! -f "$NGINX_SITE_PATH" ] && { [ -z "$env_port" ] || [ "$env_port" = "$PUBLIC_PORT" ]; }; then
    print_subheading "Setting Node to port $INTERNAL_PORT so Nginx can serve $PUBLIC_PORT..."
    sed -i "/^PORT=/d" apps/purrfect-fly/.env
    echo "PORT=$INTERNAL_PORT" >> apps/purrfect-fly/.env
fi


print_heading "Running database migrations and seeders..."
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

print_heading "Starting Purrfect Fly with PM2..."
pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
pm2 save


print_heading "Configuring Nginx as a reverse proxy..."
if [ -f "$NGINX_SITE_PATH" ]; then
    print_subheading "Nginx site already exists. Keeping it."
else
    node_port=$(grep -E "^PORT=" apps/purrfect-fly/.env | cut -d= -f2 | tr -d '"')

    cat <<EOF | sudo tee "$NGINX_SITE_PATH" > /dev/null
server {
    listen $PUBLIC_PORT;
    listen [::]:$PUBLIC_PORT;
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
        proxy_pass http://127.0.0.1:${node_port:-$INTERNAL_PORT};
    }
}
EOF
fi

print_heading "Enabling Nginx site configuration..."
sudo ln -sf "$NGINX_SITE_PATH" /etc/nginx/sites-enabled/purrfect-fly

print_heading "Testing and reloading Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

public_port=$(grep -m1 -oE "listen [0-9]+" "$NGINX_SITE_PATH" | grep -oE "[0-9]+")

if command -v ufw > /dev/null && sudo ufw status | grep -q "Status: active"; then
    print_heading "Opening port in UFW..."
    sudo ufw allow "$public_port/tcp"
fi

print_heading "Server Address"
ip=$(curl -s ifconfig.me)
print_subheading "You can access Purrfect Fly at: http://$ip:$public_port"
