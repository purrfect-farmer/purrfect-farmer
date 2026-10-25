#!/usr/bin/env bash

# Applies shared .env values to every instance created by install-many.sh.
# Usage: apply-env.sh <slug> <shared-env-file> [--no-restart]
# Each KEY=VALUE line in the shared file replaces that key in ~/<slug>-N/apps/purrfect-fly/.env.

set -e

SLUG="$1"
SHARED_FILE="$2"

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

if [ -z "$SLUG" ] || [ ! -f "$SHARED_FILE" ]; then
    echo "Usage: apply-env.sh <slug> <shared-env-file> [--no-restart]"
    exit 1
fi

# Print every ~/<slug>-N folder (N a number) that has a .env, in number order
list_instances() {
    local dir n

    for dir in "$HOME/$1"-*; do
        n="${dir#"$HOME/$1-"}"
        if [[ "$n" =~ ^[0-9]+$ ]] && [ -f "$dir/apps/purrfect-fly/.env" ]; then
            echo "$n $dir"
        fi
    done | sort -n | cut -d" " -f2-
}

mapfile -t FOLDERS < <(list_instances "$SLUG")

if [ ${#FOLDERS[@]} -eq 0 ]; then
    echo "No instances found matching $HOME/$SLUG-N"
    exit 1
fi

# Replace KEY in the env file with the given KEY=VALUE line
apply_line() {
    local env_file="$1"
    local line="$2"
    local key="${line%%=*}"

    grep -v "^$key=" "$env_file" > "$env_file.tmp" || true
    echo "$line" >> "$env_file.tmp"
    cat "$env_file.tmp" > "$env_file"
    rm "$env_file.tmp"
}

for FOLDER in "${FOLDERS[@]}"; do
    env_file="$FOLDER/apps/purrfect-fly/.env"

    if [ ! -f "$env_file" ]; then
        print_subheading "Skipping $FOLDER (no .env file)"
        continue
    fi

    print_heading "Applying $SHARED_FILE to $env_file..."
    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"
        [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
        apply_line "$env_file" "$line"
    done < "$SHARED_FILE"

    if [[ "$*" != *"--no-restart"* ]]; then
        print_subheading "Restarting with PM2..."
        (cd "$FOLDER" && pm2 restart apps/purrfect-fly/ecosystem.config.cjs --update-env)
    fi
done

if [[ "$*" != *"--no-restart"* ]]; then
    pm2 save
fi
