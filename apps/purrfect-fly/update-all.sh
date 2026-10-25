#!/bin/bash
 
set -e
 
FOLDERS=(
  "$HOME/purrfect-farmer-one"
  "$HOME/purrfect-farmer-two"
  "$HOME/purrfect-farmer-three"
)

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

# With a slug (e.g. "example"), update every ~/<slug>-N from install-many.sh
if [ -n "$1" ]; then
  mapfile -t FOLDERS < <(list_instances "$1")
fi
 
for FOLDER in "${FOLDERS[@]}"; do
  echo ">>> $FOLDER"
  cd "$FOLDER"
  bash apps/purrfect-fly/update.sh
  echo ""
done
