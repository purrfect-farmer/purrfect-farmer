#!/bin/bash
 
set -e
 
FOLDERS=(
  "$HOME/purrfect-farmer-one"
  "$HOME/purrfect-farmer-two"
  "$HOME/purrfect-farmer-three"
)
 
for FOLDER in "${FOLDERS[@]}"; do
  echo ">>> $FOLDER"
  cd "$FOLDER"
  bash apps/purrfect-fly/update.sh
  echo ""
done
 
echo ">>> Restarting PM2 processes"
pm2 restart all --update-env