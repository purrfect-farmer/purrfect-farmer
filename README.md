<p align="center"><a href="https://t.me/purrfect_community" target="_blank"><img src="public/icon.png" width="192" alt="Purrfect Logo"></a></p>

<h1 align="center">Purrfect Farmer</h1>

A Telegram Mini-Apps automation tool, deployable as PWA or Chrome Extension.

## Chrome Extension

To build as a Chrome Extension, simply run:

```bash
pnpm build-extension
```

An extension private key is required and should be saved as `dist.pem` at the root of the project.

You can load the extension through the `dist-extension` folder or (crx/zip) file inside `dist-bundle` folder.

## Whisker

Whisker should only be used within [Purrfect Whiskers](https://github.com/purrfect-farmer/purrfect-whiskers).

```bash
pnpm build-whisker
```

You should set the extension path in [Purrfect Whiskers](https://github.com/purrfect-farmer/purrfect-whiskers) settings to the `dist-whisker` folder.

## PWA

Building as PWA requires the bridge, simply run the command below to build a PWA.

```bash
pnpm build-pwa
```

Serve the `dist` folder after building.

## Bridge

Bridge allows the PWA to call Chrome APIs directly, bridge must be installed separately when using PWA. 

```bash
pnpm build-bridge
```

You can load the extension through the `dist-bridge` folder or (crx/zip) file inside `dist-bundle` folder.