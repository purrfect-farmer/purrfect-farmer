#!/bin/bash
 
set -e
 
SLUG="$1"

if [ -z "$SLUG" ]; then
  echo "Usage: update-all.sh <slug>"
  echo "Updates every ~/<slug>-N instance created by install-many.sh"
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
 
for FOLDER in "${FOLDERS[@]}"; do
  echo ">>> $FOLDER"
  cd "$FOLDER"
  bash apps/purrfect-fly/update.sh
  echo ""
done
