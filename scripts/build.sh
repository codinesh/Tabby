#!/bin/bash

# Create clean dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist

# Copy essential files
echo "Copying essential files..."
cp manifest.json background.js popup.html popup.css popup.js dist/

# Copy images
echo "Copying images..."
mkdir -p dist/images
cp -r images/*.png dist/images/
# Skip screenshots folder which isn't needed

# Copy JS files
echo "Copying JavaScript files..."
mkdir -p dist/js/core dist/js/ui
cp js/status.js dist/js/
cp js/core/*.js dist/js/core/
cp js/ui/*.js dist/js/ui/

# Copy optimized library files
echo "Copying optimized library files..."
mkdir -p dist/lib
# Only copy the SIMD version of WASM files to save space
cp lib/ort-wasm-simd.wasm dist/lib/
cp lib/transformers.min.js dist/lib/

# Create final package
echo "Creating zip package..."
cd dist
zip -r ../tabby.zip *
cd ..

echo "Build complete! Extension package created at tabby.zip"
echo "Package size: $(du -h tabby.zip | cut -f1)"