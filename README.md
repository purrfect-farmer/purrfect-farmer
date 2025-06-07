<p align="center"><a href="https://t.me/purrfect_community" target="_blank"><img src="resources/images/icon.png" width="128" alt="Purrfect Logo"></a></p>

<h1 align="center">⚡ Purrfect Fly</h1>

### Requirements
- Telegram Bot Token
- Telegram Group with Topics
- Telegram Bot must be an admin of the group
- Required Topics (Announcements, Errors)
- Additional Topics for Each Farmer

### Setup

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
git clone https://github.com/purrfect-farmer/purrfect-fly.git ~/purrfect-fly
```

##### Change Working Directory to Purrfect Fly
```bash
cd ~/purrfect-fly
```

##### Install  Packages
```bash
pnpm install
```

##### Setup .env
```bash
cp .env.example .env
```

##### Run migrations and seed
```bash
pnpm db:migrate && pnpm db:seed
```

##### Generate Key
```bash
./fly generate-jwt-secret
```

**Note: You need to fill in the `JWT_SECRET_KEY` field with the generated value inside `.env`**

##### Update .env

For **`micro`**: press (**`Ctrl+S`** then **`Ctrl+Q`)** to save.

For **`nano`**: press (**`Ctrl+S`** then **`Ctrl+X`)** to save.

```bash
micro .env
```
**Fill every required fields then save.**


##### Start Server
```bash
pm2 start ecosystem.config.cjs
```

### Updating

##### Change PWD
```bash
cd ~/purrfect-fly
```

##### Pull Changes and Update
```bash
git pull && \
pnpm install && \
pm2 reload ecosystem.config.cjs
```
