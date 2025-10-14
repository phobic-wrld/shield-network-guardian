#!/bin/bash

# Shield Network Raspberry Pi Setup Script
# Run with: curl -sSL https://raw.githubusercontent.com/your-repo/shield-network/main/raspberry-pi/install.sh | bash

set -e

echo "🛡️  Shield Network Raspberry Pi Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running on Raspberry Pi
check_raspberry_pi() {
    if [[ ! -f /proc/device-tree/model ]] || ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
        print_warning "This script is optimized for Raspberry Pi, but continuing anyway..."
    else
        print_success "Raspberry Pi detected"
    fi
}

# Update system
update_system() {
    echo "Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y curl git ufw
    print_success "System updated"
}

# Install runtime
install_runtime() {
    echo "Choose runtime:"
    echo "1) Bun (recommended - faster, less memory)"
    echo "2) Node.js (traditional)"
    read -p "Enter choice (1 or 2): " runtime_choice
    
    case $runtime_choice in
        1)
            echo "Installing Bun..."
            curl -fsSL https://bun.sh/install | bash
            source ~/.bashrc
            export PATH="$HOME/.bun/bin:$PATH"
            print_success "Bun installed"
            ;;
        2)
            echo "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            print_success "Node.js installed"
            ;;
        *)
            print_error "Invalid choice, installing Node.js as default"
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
    esac
}

# Install PM2
install_pm2() {
    echo "Installing PM2 process manager..."
    if command -v bun &> /dev/null; then
        bun install -g pm2
    else
        npm install -g pm2
    fi
    print_success "PM2 installed"
}

# Install speedtest-cli
install_speedtest() {
    echo "Installing speedtest-cli..."
    sudo apt-get install -y speedtest-cli
    print_success "speedtest-cli installed"
}

# Setup firewall
setup_firewall() {
    echo "Configuring firewall..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 3000/tcp
    print_success "Firewall configured"
}

# Clone and setup project
setup_project() {
    echo "Setting up Shield Network project..."
    
    # Create project directory
    PROJECT_DIR="$HOME/shield-network-pi"
    
    if [[ -d "$PROJECT_DIR" ]]; then
        print_warning "Project directory exists, updating..."
        cd "$PROJECT_DIR"
        git pull origin main
    else
        git clone https://github.com/your-repo/shield-network.git "$PROJECT_DIR"
        cd "$PROJECT_DIR/raspberry-pi"
    fi
    
    # Install dependencies
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
    
    # Create logs directory
    mkdir -p logs
    
    print_success "Project setup complete"
}

# Start services
start_services() {
    echo "Starting Shield Network service..."
    
    cd "$HOME/shield-network-pi/raspberry-pi"
    
    # Start with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup startup script
    pm2 startup
    
    print_success "Services started and configured for auto-start"
}

# Show final instructions
show_instructions() {
    local PI_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "🎉 Installation Complete!"
    echo "======================="
    echo ""
    echo "Your Raspberry Pi is ready for Shield Network!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Open Shield Network app on your computer/phone"
    echo "2. Connect to Raspberry Pi using IP: $PI_IP"
    echo "3. Port: 3000"
    echo ""
    echo "🔧 Management Commands:"
    echo "  pm2 status          - Check service status"
    echo "  pm2 logs            - View logs"
    echo "  pm2 restart all     - Restart services"
    echo "  pm2 monit           - Real-time monitoring"
    echo ""
    echo "📊 System Info:"
    echo "  IP Address: $PI_IP"
    echo "  Service: shield-network-pi"
    echo "  Port: 3000"
    echo "  Logs: ~/shield-network-pi/raspberry-pi/logs/"
}

# Main installation flow
main() {
    check_raspberry_pi
    update_system
    install_runtime
    install_pm2
    install_speedtest
    setup_firewall
    setup_project
    start_services
    show_instructions
    
    print_success "Shield Network Raspberry Pi setup complete! 🚀"
}

# Run main function
main "$@"