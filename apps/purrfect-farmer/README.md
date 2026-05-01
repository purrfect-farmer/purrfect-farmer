<p align="center">
  <a href="https://t.me/purrfect_community" target="_blank">
    <img src="public/icon.png" width="192" alt="Purrfect Farmer Logo">
  </a>
</p>

<h1 align="center">Purrfect Farmer</h1>

<p align="center">
  <strong>Advanced Telegram Mini-Apps Automation Tool</strong>
</p>

<p align="center">
  Automate Telegram bots and mini-apps with support for multiple deployment modes
</p>

---

## Overview

**Purrfect Farmer** is a comprehensive automation tool designed specifically for Telegram Mini-Apps and bots. It supports multiple deployment modes including standalone Chrome Extension, PWA (Progressive Web App), and integration with Purrfect Whiskers for advanced multi-account management.

### Key Features

- **Multi-Bot Support** - Automate dozens of Telegram mini-apps
- **Multiple Deployment Modes** - Extension, PWA, or Whisker integration
- **Session Management** - Local and Cloud-based Telegram sessions
- **Proxy Support** - SOCKS5/HTTP proxy configuration
- **Real-time Monitoring** - Track progress and earnings
- **Modern UI** - Built with React and Tailwind CSS

---

## Quick Start

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **pnpm** package manager
- Chrome/Chromium browser
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/purrfect-farmer/purrfect-farmer.git
cd purrfect-farmer

# Install dependencies
pnpm install

# Navigate to farmer directory
cd apps/purrfect-farmer
```

---

## Build Modes

### Chrome Extension (Standalone)

Build a standalone Chrome extension with all features:

```bash
pnpm build-extension
```

**What it does:**
- Compiles all extension components (service worker, content scripts, UI)
- Generates manifest.json
- Creates both unpacked extension and packaged files

**Output:**
- **Unpacked:** `dist-extension/` - Load directly in Chrome
- **Packed:** `dist-bundle/purrfect-farmer-v*.crx` - Installable extension
- **Zip:** `dist-bundle/purrfect-farmer-v*.zip` - For distribution

**Requirements:**
- Extension private key (`dist.pem`) must be in project root for `.crx` generation
- Generate key on first build or use existing key

**Installation Steps:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Option A: Drag and drop the `.crx` file
4. Option B: Click "Load unpacked" and select `dist-extension` folder

---

### Whisker Build

Build for integration with [Purrfect Whiskers](https://github.com/purrfect-farmer/purrfect-whiskers):

```bash
pnpm build-whisker
```

**What it does:**
- Creates optimized build for multi-account browser automation
- Integrates with Whiskers' profile management system
- Enables advanced features like account rotation and bulk operations

**Output:** `dist-whisker/`

**Setup:**
1. Install [Purrfect Whiskers](https://github.com/purrfect-farmer/purrfect-whiskers)
2. Open Whiskers settings
3. Set extension path to: `/path/to/purrfect-farmer/apps/purrfect-farmer/dist-whisker`
4. Restart Whiskers to load the extension

**Benefits:**
- Manage multiple farmer accounts simultaneously
- Profile isolation for each account
- Scheduled automation
- Cloud sync support

---

### PWA (Progressive Web App)

Build as a web application:

```bash
pnpm build-pwa
```

**What it does:**
- Creates a web-based version accessible via browser
- Generates service worker for offline support
- Includes PWA manifest for installation

**Output:** `dist/`

**Requirements:**
- Bridge extension must be installed separately (see below)
- Web server to host the files

**Deployment:**

Local Development:
```bash
# Serve the build
pnpm preview
# or use any static server
npx serve dist
```

Production Deployment:
```bash
# Using Nginx
sudo cp -r dist/* /var/www/purrfect-farmer/
# Configure Nginx to serve the directory

# Using Apache
sudo cp -r dist/* /var/www/html/purrfect-farmer/

# Using Node.js
npm install -g serve
serve -s dist -l 3000
```

**Installation as PWA:**
1. Open the hosted URL in Chrome
2. Click the install icon in the address bar
3. Or go to Settings → Install Purrfect Farmer

---

### Bridge Extension

The Bridge allows PWA to access Chrome Extension APIs:

```bash
pnpm build-bridge
```

**What it does:**
- Creates minimal extension that exposes Chrome APIs to PWA
- Enables tab management, storage, and extension features
- Acts as middleware between PWA and browser

**Output:**
- **Unpacked:** `dist-bridge/`
- **Packed:** `dist-bundle/purrfect-farmer-bridge-v*.crx`

**Why it's needed:**
- PWAs have limited browser API access
- Bridge provides native extension capabilities
- Enables features like tab control and advanced storage

**Installation:**
1. Build the bridge: `pnpm build-bridge`
2. Load in Chrome (same process as extension)
3. Bridge must be active when using PWA

---

### Build All

Build all variants at once:

```bash
pnpm build
```

This runs all build modes sequentially: PWA, Extension, Whisker, Bridge.

---

## Development

### Start Development Server

```bash
pnpm dev
```

**Features:**
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Instant updates on file changes
- Development mode with debugging enabled

**Access:** Open `http://localhost:5173`

### Development Tips

```bash
# Clean build artifacts
pnpm clean

# Generate PWA assets (icons, splash screens)
pnpm generate-pwa-assets

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

---

## Project Structure

```
apps/purrfect-farmer/
├── public/              # Static assets
│   ├── icon.png        # App icon
│   └── ...
├── src/
│   ├── app/            # Main application pages
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries and utilities
│   ├── partials/       # Page sections
│   ├── utils/          # Helper functions
│   ├── extension/      # Extension-specific code
│   ├── cloud/          # Cloud integration
│   └── main.jsx        # Entry point
├── plugins/            # Vite plugins
├── scripts/            # Build scripts
├── dist/               # PWA build output
├── dist-extension/     # Extension build output
├── dist-whisker/       # Whisker build output
├── dist-bridge/        # Bridge build output
└── dist-bundle/        # Packaged files (.crx, .zip)
```

---

## Usage

### First-Time Setup

1. **Install the extension** using one of the build modes
2. **Configure Telegram session:**
   - Click the utils button
   - Choose "Local Telegram Session"
   - Follow login prompts
3. **Configure settings** (proxy, captcha, etc.)
4. **Start farming**

### Session Modes

**Local Session:**
- Telegram session stored locally
- Faster authentication
- No cloud dependency
- Recommended for single device

**Cloud Session:**
- Session used by Purrfect Fly
- Multi-device access
- Centralized management
- Requires Fly backend

---

## Configuration

### Environment Variables

Create `.env.local` for local overrides:

```env
# API Endpoints
VITE_API_URL=https://your-fly-instance.com
VITE_API_VERSION=v1

# Features
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=true

# Build Options
VITE_PWA=false
VITE_EXTENSION=true
VITE_WHISKER=false
VITE_BRIDGE=false
```

### Extension Manifest

The manifest is generated dynamically during build. To customize, edit `plugins/generate-chrome-manifest.js`.

---

## Troubleshooting

### Extension Not Loading

```bash
# Clean and rebuild
pnpm clean
pnpm build-extension

# Check for errors in Chrome
chrome://extensions → Details → Inspect views
```

### PWA Not Installing

- Ensure served over HTTPS (or localhost)
- Check browser console for service worker errors
- Verify manifest.json is valid

### Bridge Communication Issues

- Confirm bridge extension is installed and active
- Check both extensions have matching versions
- Restart Chrome completely

### Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear build cache
pnpm clean
```

---

## Integration with Purrfect Fly

Connect to [Purrfect Fly](../purrfect-fly) for cloud-based farming:

1. **Deploy Purrfect Fly** on your server
2. **Open Cloud Manager** in Purrfect Farmer settings
3. **Configure Server URL** and authenticate with JWT token
4. **Manage cloud farming:**
   - Add/remove accounts
   - Enable/disable farmers
   - Monitor farming progress

**Note:** Cloud Manager is a built-in tool in Purrfect Farmer that provides an interface to manage your Purrfect Fly server.

See [Purrfect Fly README](../purrfect-fly/README.md) for server setup.

---

## Supported Farmers

Purrfect Farmer supports 20+ Telegram bots including game bots, earning bots, airdrop bots, task bots, and more. Farmers are continuously updated and new ones added regularly.

---

## Contributing

Contributions are welcome. To add a new farmer:

1. Create farmer class in `packages/shared/farmers/`
2. Extend `BaseDirectFarmer` or `BaseTelegramFarmer`
3. Implement required methods
4. Test thoroughly
5. Submit pull request

---

## License

This project is licensed under the [MIT License](../../LICENSE).

---

## Community & Support

- **Telegram Community:** [Join @purrfect_community](https://t.me/purrfect_community)
- **Issues:** [GitHub Issues](https://github.com/purrfect-farmer/purrfect-farmer/issues)
- **Discussions:** [GitHub Discussions](https://github.com/purrfect-farmer/purrfect-farmer/discussions)

---

<p align="center">Made with care by <a target="_blank" href="https://sadiqsalau.com">Sadiq Salau</a></p>