#!/bin/bash

# Django Admin Quick Commands
# Make this file executable: chmod +x admin_commands.sh

echo "🚀 Django Admin Quick Commands"
echo "=============================="

# Function to create admin user
create_admin() {
    echo "Creating admin user..."
    python manage.py create_admin
}

# Function to start server
start_server() {
    echo "Starting Django server..."
    python manage.py runserver
}

# Function to create demo data
create_demo() {
    echo "Creating demo data..."
    python demo_admin_data.py
}

# Function to reset database
reset_db() {
    echo "⚠️  This will delete all data! Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Resetting database..."
        rm -f db.sqlite3
        python manage.py migrate
        python setup_admin.py
        echo "✅ Database reset complete!"
    else
        echo "❌ Database reset cancelled."
    fi
}

# Function to backup database
backup_db() {
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="db_backup_${timestamp}.sqlite3"
    cp db.sqlite3 "$backup_file"
    echo "✅ Database backed up to: $backup_file"
}

# Main menu
case "$1" in
    "admin")
        create_admin
        ;;
    "server")
        start_server
        ;;
    "demo")
        create_demo
        ;;
    "reset")
        reset_db
        ;;
    "backup")
        backup_db
        ;;
    *)
        echo "Usage: $0 {admin|server|demo|reset|backup}"
        echo ""
        echo "Commands:"
        echo "  admin  - Create admin user"
        echo "  server - Start Django server"
        echo "  demo   - Create demo data"
        echo "  reset  - Reset database (⚠️  destructive)"
        echo "  backup - Backup database"
        echo ""
        echo "Examples:"
        echo "  ./admin_commands.sh admin"
        echo "  ./admin_commands.sh server"
        echo "  ./admin_commands.sh demo"
        ;;
esac