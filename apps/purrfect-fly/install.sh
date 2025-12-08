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

print_heading "Installing Nginx web server..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install \
nginx \
-y


print_heading "Installing Node Version Manager (NVM) and Node.js LTS..."

if [ -d "$HOME/.nvm" ]; then
    print_subheading "NVM is already installed."
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
    
    print_subheading "Generating JWT secret..."
    jwt_secret=$(pnpm -F purrfect-fly fly generate-jwt-secret | tail -n 1)
    
    print_subheading "Writing JWT secret to .env file..."
    sed -i "s/JWT_SECRET_KEY=\"\"/JWT_SECRET_KEY=\"$jwt_secret\"/" apps/purrfect-fly/.env
else
    print_subheading ".env file already exists. Skipping setup."
fi


print_heading "Running database migrations and seeders..."
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

print_heading "Starting Purrfect Fly with PM2..."
pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
pm2 save


print_heading "Configuring Nginx as a reverse proxy..."
cat <<EOF | sudo tee /etc/nginx/sites-available/purrfect-fly > /dev/null
server {
    listen 80;
    listen [::]:80;
    server_name _; # Change if needed

    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_http_version 1.1;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass http://127.0.0.1:3000;
    }
}
EOF

print_heading "Enabling Nginx site configuration..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/purrfect-fly /etc/nginx/sites-enabled/purrfect-fly

print_heading "Testing and reloading Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

print_heading "Server Address"
ip=$(curl ifconfig.me)
print_subheading "You can access Purrfect Fly at: http://$ip"