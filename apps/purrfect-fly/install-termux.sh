#!/data/data/com.termux/files/usr/bin/bash

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

print_heading "Installing Termux packages..."
pkg update -y
pkg upgrade -y
# python, make and clang are needed to compile sqlite3 (no Android prebuild)
pkg install -y \
nodejs-lts \
git \
python \
make \
clang \
binutils


print_heading "Installing pnpm and PM2..."
npm i -g pnpm pm2


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
# Only purrfect-fly, other apps pull deps that may not build on Android
pnpm install --filter "purrfect-fly..."

print_heading "Setting up environment variables..."
if [ ! -f apps/purrfect-fly/.env ]; then
    print_subheading ".env file not found. Creating from .env.example..."
    cp apps/purrfect-fly/.env.example apps/purrfect-fly/.env

    print_subheading "Generating JWT secret..."
    jwt_secret=$(pnpm -F purrfect-fly fly generate-jwt-secret | tail -n 1)

    print_subheading "Writing JWT secret to .env file..."
    sed -i "s/JWT_SECRET_KEY=\"\"/JWT_SECRET_KEY=\"$jwt_secret\"/" apps/purrfect-fly/.env

    # The public IP is not reachable from a phone
    sed -i "s/STARTUP_SEND_SERVER_ADDRESS=true/STARTUP_SEND_SERVER_ADDRESS=false/" apps/purrfect-fly/.env
else
    print_subheading ".env file already exists. Skipping setup."
fi


print_heading "Running database migrations and seeders..."
pnpm -F purrfect-fly db:migrate && pnpm -F purrfect-fly db:seed

print_heading "Starting Purrfect Fly with PM2..."
pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env 2>/dev/null \
    || pm2 start apps/purrfect-fly/ecosystem.config.cjs
pm2 save


print_heading "Setting up start on boot (requires the Termux:Boot app)..."
print_subheading "Get Termux:Boot from https://f-droid.org/packages/com.termux.boot/ (same source as Termux) and open it once."
mkdir -p ~/.termux/boot
cat <<EOF > ~/.termux/boot/purrfect-fly
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
pm2 resurrect
EOF
chmod +x ~/.termux/boot/purrfect-fly

print_heading "Acquiring wake lock..."
termux-wake-lock

port=$(grep -E "^PORT=" apps/purrfect-fly/.env | cut -d= -f2 | tr -d '"')
port=${port:-3000}

print_heading "Server Address"
print_subheading "You can access Purrfect Fly at: http://localhost:$port"
print_subheading "On the same Wi-Fi use http://<phone-ip>:$port"
print_subheading "Disable battery optimization for Termux so Android does not kill it."
print_subheading "Android 12+: disable child process restrictions (see README) or node gets killed in the background."
print_subheading "Now edit apps/purrfect-fly/.env and run: pm2 restart all --update-env"
