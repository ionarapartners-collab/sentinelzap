#!/bin/bash
# Script to install Chromium for WPPConnect in production

echo "Installing Chromium for WPPConnect..."
cd /home/ubuntu/SentinelZap
npx puppeteer browsers install chrome

echo "Chromium installed successfully!"
echo "Location: /home/ubuntu/.cache/puppeteer/chrome/"
ls -la /home/ubuntu/.cache/puppeteer/chrome/ | tail -5
