#!/bin/sh
# Docker entrypoint script for runtime configuration
# Injects environment variables into the frontend at container startup

# Create runtime config file with environment variables
# This allows VITE_API_BASE_URL to be set at runtime instead of build time
# Uses env-config.js to match the script tag in index.html
cat > /usr/share/nginx/html/env-config.js << EOF
window.__RUNTIME_CONFIG__ = {
    API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:3001/api}"
};
EOF

# Execute the CMD (nginx)
exec "$@"
