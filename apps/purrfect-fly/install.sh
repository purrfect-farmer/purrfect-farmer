#!/usr/bin/env bash


echo "Installing Nginx web server..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install \
nginx \
-y


echo "Installing Node Version Manager (NVM) and Node.js LTS..."

if [ -d "$HOME/.nvm" ]; then
    echo "NVM is already installed."
else
    echo "NVM is not installed. Proceeding with installation..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

    \. "$HOME/.nvm/nvm.sh"

    nvm install --lts

    npm i -g npm
    npm i -g pnpm
    npm i -g pm2
fi


echo "Setting up PM2 to run on startup..."
startup_command=$(pm2 startup | grep "sudo env" | sed 's/^[[:space:]]*//')
if [ -n "$startup_command" ]; then
    echo "Executing PM2 startup command..."
    eval "$startup_command"
else
    echo "PM2 startup already configured or command not found."
fi

echo "Setting up Purrfect Farmer repository..."
if [ -d "$HOME/purrfect-farmer/.git" ]; then
    echo "Repository already exists. Pulling latest changes..."
    cd ~/purrfect-farmer
    git pull origin main
else
    echo "Cloning Purrfect Farmer repository..."
    git clone https://github.com/purrfect-farmer/purrfect-farmer.git ~/purrfect-farmer
    cd ~/purrfect-farmer
fi

echo "Installing project dependencies..."
pnpm install

echo "Setting up environment variables..."
if [ ! -f apps/purrfect-fly/.env ]; then
    echo ".env file not found. Creating from .env.example..."
    cp apps/purrfect-fly/.env.example apps/purrfect-fly/.env
    
    echo "Generating JWT secret..."
    jwt_secret=$(pnpm -F purrfect-fly fly generate-jwt-secret | tail -n 1)
    
    echo "Writing JWT secret to .env file..."
    sed -i "s/JWT_SECRET_KEY=\"\"/JWT_SECRET_KEY=\"$jwt_secret\"/" apps/purrfect-fly/.env
else
    echo ".env file already exists. Skipping setup."
fi


echo "Running database migrations and seeders..."
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

echo "Starting Purrfect Fly with PM2..."
pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env
pm2 save


echo "Configuring Nginx as a reverse proxy..."
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

echo "Enabling Nginx site configuration..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/purrfect-fly /etc/nginx/sites-enabled/purrfect-fly

echo "Testing and reloading Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx