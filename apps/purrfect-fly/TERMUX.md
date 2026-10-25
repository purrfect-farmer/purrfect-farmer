# Purrfect Fly on Android (Termux)

Running Fly on a phone is a last resort: Android keeps trying to stop background processes. Use a VPS ([README](README.md)) when you can.

## 1. Install the apps

Download [Termux](https://f-droid.org/packages/com.termux/) and [Termux:Boot](https://f-droid.org/packages/com.termux.boot/) from F-Droid (or GitHub releases: [Termux](https://github.com/termux/termux-app/releases), [Termux:Boot](https://github.com/termux/termux-boot/releases)). Get both from the same source, as their signatures must match. Open Termux:Boot once to enable start on boot.

## 2. Run the installer in Termux

```bash
curl -o- https://raw.githubusercontent.com/purrfect-farmer/purrfect-farmer/main/apps/purrfect-fly/install-termux.sh | bash
```

The script:
- Installs Node.js LTS, git and the build tools sqlite3 needs (`python`, `make`, `clang`, `binutils`)
- Installs pnpm and PM2
- Clones `~/purrfect-farmer` and installs only Purrfect Fly's dependencies
- Creates `apps/purrfect-fly/.env` with generated keys and `STARTUP_SEND_SERVER_ADDRESS=false`
- Runs the database migrations and seeders, then starts Fly with PM2
- Adds a Termux:Boot script that takes a wake lock and runs `pm2 resurrect` on boot

When it finishes, Fly runs at `http://localhost:4000` (the `PORT` in `.env`).

## 3. Configure

```bash
cd ~/purrfect-farmer
nano apps/purrfect-fly/.env
pm2 restart all --update-env
```

See [Configure Environment](README.md#step-6-configure-environment) for what each value means.

## 4. Keep it running all day

One-time phone settings:
- Android 14+: Developer options > enable "Disable child process restrictions", or Android kills node in the background.
- Android 12-13: run once from a computer: `adb shell device_config set_sync_disabled_for_tests persistent` and `adb shell device_config put activity_manager max_phantom_processes 2147483647`.
- Set Termux battery usage to "Unrestricted", disable battery optimization, allow autostart (Xiaomi, Oppo, etc.) and lock Termux in recents.
- Keep the phone charging, and don't tap "Exit" on the Termux notification.

## Updating

```bash
cd ~/purrfect-farmer
bash apps/purrfect-fly/update.sh
```

On Termux it installs only Purrfect Fly's dependencies.
