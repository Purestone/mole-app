#!/bin/bash

# Clear previous builds
rm -rf dist/Mole-darwin-x64

echo "Packaging Mole app for macOS (x64)..."
npx electron-packager . Mole \
  --platform=darwin \
  --arch=x64 \
  --out=dist \
  --overwrite \
  --icon=icon.icns \
  --prune=true

echo "Build complete. Output located in dist/Mole-darwin-x64"
