<p align="center"><a href="https://t.me/purrfect_community" target="_blank"><img src="public/icon.png" width="192" alt="Purrfect Logo"></a></p>

<h1 align="center">Purrfect Farmer</h1>

A Telegram Mini-Apps automation tool, deployable as PWA or Chrome Extension.

## Chrome Extension

To build as a Chrome Extension, simply run:

```bash
pnpm build-extension
```

An extension private key is required and should be saved as `dist.pem` at the root of the project.

You can load the extension through the `dist` folder or crx file inside `dist-extension` folder.

## PWA

Building as PWA requires the bridge, simply run the command below to build a PWA.

```bash
pnpm build-pwa
```

## Bridge

Bridge allows the PWA to call Chrome APIs, bridge must be installed separately when using PWA. 

```bash
pnpm build-bridge
```