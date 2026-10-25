<p align="center">
  <a href="https://purrfect-farmer.github.io" target="_blank">
    <img src="apps/purrfect-farmer/public/icon.png" width="192" alt="Purrfect Farmer Logo">
  </a>
</p>

<h1 align="center">Purrfect Farmer</h1>

<p align="center">
  <strong>Advanced Telegram Mini-Apps Automation Tool</strong>
</p>

<p align="center">
  <a href="https://t.me/purrfect_community">
    <img src="https://img.shields.io/badge/Telegram-Community-blue?style=for-the-badge&logo=telegram" alt="Telegram Community">
  </a>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&" alt="License">
  <img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20PWA-orange?style=for-the-badge&" alt="Platform">
</p>

---

## Overview

**Purrfect Farmer** is a powerful automation tool designed for Telegram Mini-Apps. It offers flexible deployment options as a Chrome Extension, Progressive Web App (PWA), or integrated with Purrfect Whiskers for advanced multi-account management.

### Key Features

- **Multi-Bot Automation** - Automate multiple Telegram mini-apps simultaneously
- **Flexible Deployment** - Chrome Extension, PWA, or Whisker integration
- **Cloud Support** - Optional cloud management with Purrfect Fly
- **Session Management** - Local and Cloud-based Telegram sessions
- **Proxy Support** - Built-in proxy configuration
- **Real-time Monitoring** - Track farming progress and earnings

---

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- Chrome browser (for extension)

### Installation

```bash
# Clone the repository
git clone https://github.com/purrfect-farmer/purrfect-farmer.git
cd purrfect-farmer

# Install dependencies
pnpm install
```

---

## Build Options

### Chrome Extension (Standalone)

Build the standalone Chrome extension with all features included:

```bash
pnpm build:farmer
```

**Output:** `.crx` and `.zip` files in `apps/purrfect-farmer/dist-bundle`

**Installation:**

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Drag and drop the `.crx` file or load unpacked from `dist-extension` folder

**Note:** Requires a private key (`dist.pem`) in the project root for building `.crx` files.

### Whisker Build

For integration with [Purrfect Whiskers](https://github.com/purrfect-farmer/purrfect-whiskers) (multi-account management):

```bash
pnpm -F purrfect-farmer build-whisker
```

**Output:** Extension in `apps/purrfect-farmer/dist-whisker`

Configure the extension path in Purrfect Whiskers settings to point to the `dist-whisker` folder.

### PWA (Progressive Web App)

Build as a Progressive Web App for web-based deployment:

```bash
pnpm -F purrfect-farmer build-pwa
```

**Output:** Static files in `apps/purrfect-farmer/dist`

**Requirements:** PWA requires the Bridge extension (see below) for full functionality.

### Bridge Extension

The Bridge enables PWA to access Chrome APIs. Required when using PWA mode:

```bash
pnpm -F purrfect-farmer build-bridge
```

**Installation:**

1. Load the extension from `dist-bridge` folder
2. Or install from `.crx` file in `dist-bundle`

---

## Purrfect Fly (Cloud Platform)

**Purrfect Fly** is the cloud backend for managing multiple Purrfect Farmer instances remotely.

### Features

- Remote farmer management
- Centralized monitoring
- Secure JWT authentication
- Telegram bot integration
- Database-backed accounts and proxies

### Quick Deploy

```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install.sh | bash
```

Or with wget:

```bash
wget -qO- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install.sh | bash
```

This serves Purrfect Fly at `http://<your-server-ip>:4000` (Nginx on `4000`, Node on `14000` behind it).

### Multiple Instances on One Server

Install [Purrfect Seeker](https://github.com/purrfect-farmer/purrfect-seeker) (recommended) and several Fly instances on one VPS. With Seeker, accounts look their server up by ID, so when a server moves to a new address you update Seeker instead of every account. Replace `example` / `Example` with your own slug and name, and give both commands the same name, count and base port.

**1. Install Seeker.** Edit the flags, then run:

```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-seeker/main/install.sh | bash -s -- --port 3000 --fly-name Example --fly-count 10 --fly-base-port 4001
```

| Flag | Default | Role |
| ---- | ------- | ---- |
| `--port` | existing site's, else `3000` | Public port Seeker is served on through Nginx. Node runs on this port + 10000 (`13000` by default). |
| `--fly-name` | none | Name of the Fly servers to register, as `<fly-name> (n)`. Leave it out to only install Seeker. |
| `--fly-count` | `10` | How many Fly servers to register, `1` to `--fly-count`. Re-run with a higher count to register more; existing names are skipped. |
| `--fly-base-port` | `4001` | Public port of the first Fly server; server `n` is registered at `http://<ip>:<fly-base-port + n - 1>`. |

**2. Install the Fly instances.** Edit the flags, then run:

```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install-many.sh | bash -s -- --slug example --name Example --count 10 --base-port 4001
```

| Flag | Default | Role |
| ---- | ------- | ---- |
| `--slug` | `example` | Folder and PM2 name prefix: instance `n` lives in `~/<slug>-n` and runs as PM2 app `<slug>-n`. |
| `--name` | `Example` | Display name prefix: instance `n` is named `<name> (n)` (`APP_NAME`). |
| `--count` | `10` | How many instances to install, `1` to `--count`. Re-run with a higher count to add instances; running ones are left untouched and stopped ones are repaired. |
| `--base-port` | existing install's, else `4001` | Public port of the first instance; instance `n` is served at `http://<ip>:<base-port + n - 1>`, with Node on that port + 10000. |

The full step-by-step guide (shared settings, updates, Cloud Manager) is in the [Purrfect Fly README](apps/purrfect-fly/README.md#multiple-instances-on-one-server).

**Detailed Setup:** See [Purrfect Fly README](apps/purrfect-fly/README.md)

---

## Documentation

- **[Purrfect Farmer Documentation](apps/purrfect-farmer/README.md)** - Detailed farmer setup and configuration
- **[Purrfect Fly Documentation](apps/purrfect-fly/README.md)** - Cloud platform installation and management
- **[Purrfect Whiskers](https://github.com/purrfect-farmer/purrfect-whiskers)** - Efficiently manage multiple instances of the Purrfect Farmer

---

## Development

### Project Structure

```
purrfect-farmer/
├── apps/
│   ├── purrfect-farmer/    # Main automation extension
│   └── purrfect-fly/        # Cloud backend platform
└── packages/
    └── shared/              # Shared utilities and farmers
```

### Development Commands

```bash
# Start farmer in dev mode
pnpm -F purrfect-farmer dev

# Start Fly server in dev mode
pnpm start:fly

# Run migrations (Fly)
pnpm -F purrfect-fly db:migrate

# Run seeders (Fly)
pnpm -F purrfect-fly db:seed
```

---

## Contributing

Contributions are welcome. Please feel free to submit issues and pull requests.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Community & Support

- **Telegram Community:** [Join @purrfect_community](https://t.me/purrfect_community)
- **Issues:** [GitHub Issues](https://github.com/purrfect-farmer/purrfect-farmer/issues)

---

<p align="center">Made with care by <a target="_blank" href="https://sadiqsalau.com">Sadiq Salau</a></p>
