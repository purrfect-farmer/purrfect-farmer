<p align="center"><a href="https://t.me/purrfect_community" target="_blank"><img src="resources/images/icon.png" width="128" alt="Purrfect Logo"></a></p>

<h1 align="center">⚡ Purrfect Fly</h1>

### Requirements

- Telegram Bot Token
- Telegram Group with Topics
- Telegram Bot must be an admin of the group
- Required Topics (Announcements, Errors, Farming)
- Additional Topics for Each Farmer

### Setup

##### Install Packages

```bash
sudo apt-get update
sudo apt-get install \
nginx \
nano \
micro \
-y
```

##### Setup Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash

\. "$HOME/.nvm/nvm.sh"

nvm install --lts

npm i -g npm
npm i -g pnpm
npm i -g pm2
```

##### Setup PM2 (Required)

Run the following command and follow the instructions it generates:

```bash
pm2 startup
```

**PM2 will generate a command for you to copy and run, ensure to run the command!!!**

### Installation

##### Clone the repository

```bash
git clone https://github.com/purrfect-farmer/purrfect-farmer.git ~/purrfect-farmer
```

##### Change Working Directory to Purrfect Fly

```bash
cd ~/purrfect-farmer
```

##### Install Packages

```bash
pnpm install
```

##### Setup .env

```bash
cp apps/purrfect-fly/.env.example apps/purrfect-fly/.env
```

##### Run migrations and seed

```bash
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed
```

##### Generate Key

```bash
pnpm -F purrfect-fly fly generate-jwt-secret
```

**Note: You need to fill in the `JWT_SECRET_KEY` field with the generated value inside `.env`**

##### Update .env

For **`micro`**: press (**`Ctrl+S`** then **`Ctrl+Q`)** to save.

For **`nano`**: press (**`Ctrl+S`** then **`Ctrl+X`)** to save.

```bash
micro apps/purrfect-fly/.env
```

**Fill every required fields then save.**

##### Start Server

```bash
pm2 start apps/purrfect-fly/ecosystem.config.cjs
```

##### Save PM2 Processes

```bash
pm2 save
```

### Nginx

##### Create Purrfect Fly Nginx Server Block

```bash
sudo micro /etc/nginx/sites-available/purrfect-fly
```

##### Add Block Code

Paste the following block and save.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _; # Change if needed

    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_http_version 1.1;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:3000;
    }
}
```

##### Disable Default Nginx Server

```bash
sudo rm /etc/nginx/sites-enabled/default
```

##### Enable Purrfect Fly Server

```bash
sudo ln -s /etc/nginx/sites-available/purrfect-fly /etc/nginx/sites-enabled/
```

##### Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Updating

##### Change PWD

```bash
cd ~/purrfect-farmer
```

##### Pull Changes and Update

```bash
git pull && \
pnpm install && \
pm2 reload apps/purrfect-fly/ecosystem.config.cjs --update-env && \
pm2 save
```
