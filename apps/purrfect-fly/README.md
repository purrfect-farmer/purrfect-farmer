<p align="center">
  <a href="https://t.me/purrfect_community" target="_blank">
    <img src="resources/images/icon.png" width="128" alt="Purrfect Fly Logo">
  </a>
</p>

<h1 align="center">Purrfect Fly</h1>

<p align="center">
  <strong>Cloud-Based Farming Platform</strong>
</p>

<p align="center">
  Run all Purrfect Farmer bots autonomously on your server, 24/7
</p>

---

## Overview

**Purrfect Fly** is a cloud-based farming platform that runs all Purrfect Farmer bots directly on your server. Unlike the browser extension which runs locally, Purrfect Fly operates autonomously in the cloud, managing multiple Telegram accounts, executing farming tasks 24/7, and providing centralized control through the Cloud Manager tool in Purrfect Farmer.

### Key Features

- **Cloud-Based Farming** - Runs all farmers directly on your server, no browser needed
- **Autonomous Operation** - 24/7 automated farming without manual intervention
- **Cloud Manager Integration** - Control everything through Purrfect Farmer's Cloud Manager
- **Multi-Account Management** - Handle unlimited Telegram accounts
- **Real-Time Monitoring** - Live updates and notifications via Telegram topics
- **Database Backend** - Persistent storage for accounts, proxies, and sessions
- **Secure API** - JWT-based authentication for Cloud Manager
- **Scheduled Tasks** - Automated farming cycles and maintenance
- **Proxy Support** - Built-in proxy rotation and management

---

## Quick Installation

### One-Line Install (Recommended)

**Using curl:**
```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install.sh | bash
```

**Using wget:**
```bash
wget -qO- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install.sh | bash
```

**On Android (Termux):**
```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install-termux.sh | bash
```
Download [Termux](https://f-droid.org/packages/com.termux/) and [Termux:Boot](https://f-droid.org/packages/com.termux.boot/) from F-Droid (or GitHub releases: [Termux](https://github.com/termux/termux-app/releases), [Termux:Boot](https://github.com/termux/termux-boot/releases)). Get both from the same source, as their signatures must match. Open Termux:Boot once to enable start on boot, and disable battery optimization for Termux.

To keep it running all day (one-time phone settings):
- Android 14+: Developer options > enable "Disable child process restrictions", or Android kills node in the background.
- Android 12-13: run once from a computer: `adb shell device_config set_sync_disabled_for_tests persistent` and `adb shell device_config put activity_manager max_phantom_processes 2147483647`.
- Set Termux battery usage to "Unrestricted", allow autostart (Xiaomi, Oppo, etc.) and lock Termux in recents.
- Keep the phone charging, and don't tap "Exit" on the Termux notification.

The installation script will:
- Install system dependencies (Nginx, text editors)
- Setup Node.js via NVM
- Install pnpm and PM2
- Clone the repository
- Install project dependencies
- Serve it through Nginx at `http://<your-server-ip>:4000` (Node runs on `14000` behind it)
- Guide you through configuration

An existing Nginx site at `/etc/nginx/sites-available/purrfect-fly` is kept as it is, so running the script again on an older install does not move it off its port.

### Multiple Instances on One Server

Run several isolated instances side by side on a fresh Ubuntu / Debian VPS. Each one gets its own clone, `.env`, database, PM2 app and public port. Replace `example` / `Example` below with your own slug and name.

**1. Log in**

```bash
ssh root@<your-vps-ip>
```

**2. Install Seeker (optional)**

```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-seeker/main/install.sh | bash -s -- 3000 Example 10 4001
```

This serves [Purrfect Seeker](https://github.com/purrfect-farmer/purrfect-seeker) at `http://<ip>:3000` and registers `Example (1)` to `Example (10)` at `http://<ip>:4001` to `http://<ip>:4010`. Use the same name, count and base port as step 3. Skip it if you don't use Seeker or run it on another server.

| # | Argument | Default | Role |
| - | -------- | ------- | ---- |
| 1 | `port` | `3000` | Public port Seeker is served on through Nginx. Node runs on this port + 10000 (`13000` by default). |
| 2 | `fly-name` | none | Name of the Fly servers to register, as `<fly-name> (n)`. Leave it out to only install Seeker. |
| 3 | `fly-count` | `10` | How many Fly servers to register, `1` to `fly-count`. |
| 4 | `fly-base-port` | `4001` | Public port of the first Fly server; server `n` is registered at `http://<ip>:<fly-base-port + n - 1>`. |

**3. Install the instances**

```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install-many.sh | bash -s -- example Example 10 4001
```

| # | Argument | Default | Role |
| - | -------- | ------- | ---- |
| 1 | `slug` | `example` | Folder and PM2 name prefix: instance `n` lives in `~/<slug>-n` and runs as PM2 app `<slug>-n`. |
| 2 | `name` | `Example` | Display name prefix: instance `n` is named `<name> (n)` (`APP_NAME`). |
| 3 | `count` | `10` | How many instances to install, `1` to `count`. |
| 4 | `base-port` | `4001` | Public port of the first instance; instance `n` is served at `http://<ip>:<base-port + n - 1>`, with Node on that port + 10000. |

This creates `~/example-1` to `~/example-10`, PM2 apps `example-1` to `example-10`, named `Example (1)` to `Example (10)`, reachable at `http://<ip>:4001` to `http://<ip>:4010`. Nginx owns the public ports and proxies to Node on the port 10000 higher (`14001`, ...).

**4. Load Node and PM2 in your shell**

```bash
source ~/.nvm/nvm.sh
```

Logging out and back in works too.

**5. Write the shared settings**

Put the values every instance shares in one file:

```bash
nano ~/shared.env
```

```ini
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="-100..."
TELEGRAM_ANNOUNCEMENT_THREAD_ID="..."
TELEGRAM_ERROR_THREAD_ID="..."
TELEGRAM_FARMING_THREAD_ID="..."
SERVER_ADMIN_TELEGRAM_ID="..."
CAPTCHA_API_KEY="..."
```

**6. Apply them to every instance**

```bash
bash ~/example-1/apps/purrfect-fly/apply-env.sh example ~/shared.env
```

Each line replaces that key in every instance's `.env` and adds it if missing. Other keys (`PORT`, `APP_NAME`, `PM2_APP_NAME`, `JWT_SECRET_KEY`...) are kept. Each instance is then restarted; pass `--no-restart` to skip that.

**7. Per-instance values (optional)**

For a value that differs per instance, such as `PRIMARY_ACCOUNT_ID`:

```bash
nano ~/example-3/apps/purrfect-fly/.env
pm2 restart example-3 --update-env
```

**8. Check they are running**

```bash
pm2 ls
```

All instances should be `online`. If one is not, check `pm2 logs example-N --lines 50`.

**9. Open the ports**

The script opens them in `ufw` when it is active. If your provider has its own firewall or security group, allow TCP `4001-4010` there too (and `3000` for Seeker).

**10. Connect from Cloud Manager**

Add each server as `http://<your-vps-ip>:4001` to `http://<your-vps-ip>:4010`. With Seeker, set the Seeker server to `http://<your-vps-ip>:3000` in the farmer settings and pick each server from its list instead.

**Later**

- Update all instances: `bash ~/example-1/apps/purrfect-fly/update-all.sh example`
- Change a shared value: edit `~/shared.env` and repeat step 6.

---

## Requirements

### System Requirements

- **OS:** Ubuntu 20.04+ / Debian 11+ (or compatible Linux distribution)
- **RAM:** Minimum 1GB (2GB+ recommended)
- **Storage:** At least 2GB free space
- **Network:** Public IP or accessible via domain

### Telegram Requirements

Before installation, you need:

1. **Telegram Bot Token**
   - Create a bot via [@BotFather](https://t.me/BotFather)
   - Save the token provided

2. **Telegram Group with Topics**
   - Create a new Telegram group
   - Enable "Topics" in group settings
   - Add your bot as an admin with full permissions

3. **Required Topics** (create these in your group):
   - **Announcements** - General notifications
   - **Errors** - Error logs and failures
   - **Farming** - Farming activity logs
   - **Additional Topics (Optional)** - One topic per farmer for detailed logs

**Note:** The Telegram bot is used for notifications and logs only. All management is done through the Cloud Manager tool in Purrfect Farmer extension/PWA.

---

## Manual Installation

### Step 1: Install System Packages

```bash
sudo apt-get update
sudo apt-get install \
  nginx \
  nano \
  micro \
  curl \
  wget \
  git \
  -y
```

### Step 2: Setup Node.js

Install NVM (Node Version Manager):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

Load NVM:

```bash
\. "$HOME/.nvm/nvm.sh"
```

Install Node.js LTS:

```bash
nvm install --lts
```

Install global packages:

```bash
npm i -g npm
npm i -g pnpm
npm i -g pm2
```

### Step 3: Setup PM2 Auto-Startup

Configure PM2 to start on system boot:

```bash
pm2 startup
```

**Important:** PM2 will generate a command like:
```bash
sudo env PATH=$PATH:/home/username/.nvm/versions/node/vX.X.X/bin ...
```
Copy and run the generated command.

### Step 4: Clone Repository

```bash
git clone https://github.com/purrfect-farmer/purrfect-farmer.git ~/purrfect-farmer
cd ~/purrfect-farmer
```

### Step 5: Install Dependencies

```bash
pnpm install
```

### Step 6: Configure Environment

Create environment file:

```bash
cp apps/purrfect-fly/.env.example apps/purrfect-fly/.env
```

Generate the server keys (`JWT_SECRET_KEY` and `ENCRYPTION_KEY`). The server also generates any missing key on its first start:

```bash
pnpm -F purrfect-fly fly key:generate
```

Then edit `.env`:

```bash
micro apps/purrfect-fly/.env
# or
nano apps/purrfect-fly/.env
```

**Required environment variables:**

```env
# Keys, filled in by key:generate. Back up .env: losing ENCRYPTION_KEY loses stored wallets.
JWT_SECRET_KEY=<generated>
ENCRYPTION_KEY=<generated>

# Telegram
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_GROUP_ID=<your-group-id>
TELEGRAM_ANNOUNCEMENTS_TOPIC_ID=<topic-id>
TELEGRAM_ERRORS_TOPIC_ID=<topic-id>
TELEGRAM_FARMING_TOPIC_ID=<topic-id>

# Server
PORT=4000
NODE_ENV=production
```

**Keyboard shortcuts:**
- **micro:** `Ctrl+S` to save, `Ctrl+Q` to quit
- **nano:** `Ctrl+S` to save, `Ctrl+X` to exit

### Step 7: Initialize Database

Run migrations and seeders (SQLite database will be created automatically):

```bash
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed
```

**Note:** Purrfect Fly uses SQLite for database storage. The database file will be created in `apps/purrfect-fly/db/` on first run.

**Default Admin User:**
- **Username:** `admin`
- **Password:** `password`

**Important:** Change the default password immediately after first login through Cloud Manager.

### Step 8: Start Application

```bash
pm2 start apps/purrfect-fly/ecosystem.config.cjs
pm2 save
```

Verify it's running:

```bash
pm2 status
pm2 logs purrfect-fly
```

---

## Nginx Configuration

The install script already serves Purrfect Fly on port `4000`. Follow this section to serve it on your own domain instead (ports 80/443, needed for HTTPS with Certbot).

### Step 1: Create Nginx Server Block

```bash
sudo micro /etc/nginx/sites-available/purrfect-fly
```

### Step 2: Add Configuration

Paste the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;  # Change to your domain or use '_' for any

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy settings
    location / {
        proxy_http_version 1.1;
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Proxy pass
        proxy_pass http://127.0.0.1:4000;
    }

    # Optional: Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        proxy_pass http://127.0.0.1:4000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Enable Site

```bash
# Disable default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Enable Purrfect Fly
sudo ln -s /etc/nginx/sites-available/purrfect-fly /etc/nginx/sites-enabled/
```

### Step 4: Test and Reload

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Optional: Enable HTTPS with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Updating

Keep your installation up to date:

```bash
cd ~/purrfect-farmer

git pull && \
pnpm install && \
pnpm -F purrfect-fly db:migrate && \
pnpm -F purrfect-fly db:seed && \
pm2 reload apps/purrfect-fly/ecosystem.config.cjs --update-env && \
pm2 save
```

Or use the update script:

```bash
bash apps/purrfect-fly/update.sh
```

---

## Management Commands

### PM2 Process Management

```bash
# View status
pm2 status

# View logs
pm2 logs purrfect-fly

# Restart
pm2 restart purrfect-fly

# Stop
pm2 stop purrfect-fly

# Delete process
pm2 delete purrfect-fly

# Monitor
pm2 monit
```

### Database Commands

```bash
# Run migrations
pnpm -F purrfect-fly db:migrate

# Rollback last migration
pnpm -F purrfect-fly db:migrate:undo

# Seed database
pnpm -F purrfect-fly db:seed

# Reset database
pnpm -F purrfect-fly db:migrate:refresh
```

### Fly CLI Commands

```bash
# Generate missing server keys
pnpm -F purrfect-fly fly key:generate

# List accounts
pnpm -F purrfect-fly fly list-accounts

# Update accounts
pnpm -F purrfect-fly fly update-accounts

# Test proxies
pnpm -F purrfect-fly fly test-proxies

# Clean database
pnpm -F purrfect-fly fly clean-db

# Export backup
pnpm -F purrfect-fly fly export-backup

# Import backup
pnpm -F purrfect-fly fly import-backup <file>
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
sudo lsof -i :4000

# Kill the process
sudo kill -9 <PID>
```

### PM2 Not Starting on Boot

```bash
# Re-run PM2 startup
pm2 unstartup
pm2 startup

# Follow the generated instructions
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs purrfect-fly

# Restart app
pm2 restart purrfect-fly
```

---

## Architecture

```
┌─────────────────────┐
│  Purrfect Farmer    │
│  Cloud Manager      │◄────── Manage accounts, proxies, farmers
│  (Extension/PWA)    │
└──────────┬──────────┘
           │
           │ HTTPS/REST API (JWT Auth)
           │
┌──────────▼──────────┐
│  Purrfect Fly       │
│  Node.js Server     │◄────── Runs all farmers in cloud
│  (PM2)              │
│                     │
│  ┌───────────────┐  │
│  │ Farmer Bots   │  │
│  │ - 20+ bots    │  │
│  │ - Auto-farming│  │
│  │ - 24/7 uptime │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
      ┌────┴─────┬──────────────┐
      │          │              │
┌─────▼────┐ ┌──▼────────┐ ┌──▼──────────┐
│ SQLite   │ │ Telegram  │ │ Telegram    │
│ Database │ │ Accounts  │ │ Bot (Logs)  │
│          │ │ (Sessions)│ │             │
└──────────┘ └───────────┘ └─────────────┘
```

**How It Works:**
- **Cloud Manager** (in Purrfect Farmer) - Interface to manage Fly
- **API Communication** - Secure JWT-authenticated REST API
- **Server Execution** - All farmers run on server, not in browser
- **Telegram Notifications** - Logs sent to Telegram group topics
- **Database Storage** - Accounts, sessions, proxies stored in SQLite

---

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

2. **Use HTTPS** - Always enable SSL/TLS with Certbot

3. **Change Default Password** - Update the default admin password immediately

4. **Strong JWT Secret** - Use a complex JWT secret key

5. **Regular Updates** - Keep system and dependencies updated

6. **Backup Regularly** - Export database backups frequently (SQLite db file)

---

## License

This project is licensed under the [MIT License](../../LICENSE).

---

## Community & Support

- **Telegram Community:** [Join @purrfect_community](https://t.me/purrfect_community)
- **Issues:** [GitHub Issues](https://github.com/purrfect-farmer/purrfect-farmer/issues)
- **Main Repository:** [purrfect-farmer](https://github.com/purrfect-farmer/purrfect-farmer)

---

<p align="center">Made with care by <a target="_blank" href="https://sadiqsalau.com">Sadiq Salau</a></p>