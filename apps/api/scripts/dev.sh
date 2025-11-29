#!/bin/bash

# Kill any process running on port 3001
echo "Checking for processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No process found on port 3001"

# Wait a moment for the port to be released
sleep 1

# Start the NestJS app in watch mode
echo "Starting NestJS API on port 3001..."
nest start --watch

