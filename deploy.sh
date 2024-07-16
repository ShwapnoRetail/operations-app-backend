#!/bin/bash

source ~/.nvm/nvm.sh

# Use the correct Node.js version
nvm use 20.5.1  # Replace with your desired Node.js version

# Fetch the latest changes from the Git repository
# git pull origin main  # Replace 'main' with your branch name

# Install or update dependencies
npm install

# Build your application (if needed)
# npm run build

# Restart your application using pm2
pm2 restart shwapnooperations-dev  # Replace 'your_app_name' with your app's name in pm2

# Optionally, run database migrations or perform other deployment tasks here

# Exit the script
exit 0
