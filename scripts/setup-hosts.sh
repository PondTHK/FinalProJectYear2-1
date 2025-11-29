#!/bin/bash

# Script to add subdomains to hosts file
# Requires sudo access

HOSTS_FILE="/etc/hosts"
DOMAINS=("user.smartpersona.local" "admin.smartpersona.local")

echo "🔧 Setting up subdomains in hosts file..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo: sudo bash setup-hosts.sh"
    exit 1
fi

# Backup hosts file
cp "$HOSTS_FILE" "$HOSTS_FILE.backup"
echo "✅ Backed up hosts file to $HOSTS_FILE.backup"

# Add domains if they don't exist
for domain in "${DOMAINS[@]}"; do
    if grep -q "$domain" "$HOSTS_FILE"; then
        echo "⚠️  $domain already exists in hosts file"
    else
        echo "127.0.0.1    $domain" >> "$HOSTS_FILE"
        echo "✅ Added $domain"
    fi
done

echo ""
echo "🎉 Setup complete!"
echo "📱 User App: http://user.smartpersona.local"
echo "👨‍💼 Admin App: http://admin.smartpersona.local"
echo ""
echo "💡 To remove, edit $HOSTS_FILE manually"

