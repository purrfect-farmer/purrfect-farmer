#!/bin/bash
 
set -e
 
FOLDERS=(
  "$HOME/purrfect-farmer-one"
  "$HOME/purrfect-farmer-two"
  "$HOME/purrfect-farmer-three"
)

# With a slug (e.g. "example"), update every ~/<slug>-N from install-many.sh
if [ -n "$1" ]; then
  mapfile -t FOLDERS < <(ls -d "$HOME/$1"-[0-9]* | sort -V)
fi
 
for FOLDER in "${FOLDERS[@]}"; do
  echo ">>> $FOLDER"
  cd "$FOLDER"
  bash apps/purrfect-fly/update.sh
  echo ""
done
