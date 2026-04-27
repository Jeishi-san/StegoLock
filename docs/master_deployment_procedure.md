# Master Deployment Procedure: Stegolock

This document provides the chronological steps required to move Stegolock from a local development environment (Laragon) to a live production server.

---

## Phase 1: Preparation & Tools
Before starting, ensure you have access to:
- **GitHub Repository**: Your code must be pushed to a remote repository.
- **VPS Provider**: DigitalOcean, Hetzner, or Linode (Ubuntu 22.04 LTS recommended).
- **SSH Client**: PowerShell, PuTTY, or Termius.
- **Domain Name**: Pointed to your server's IP address.

---

## Phase 2: Server Provisioning
1. **Create the VPS**:
   - OS: Ubuntu 22.04 LTS or 24.04 LTS.
   - Plan: Minimum 1GB RAM (2GB recommended for smoother processing).
   - Authentication: Use SSH Keys.
2. **Access the Server**:
   ```bash
   ssh root@your_server_ip
   ```
3. **Initial Update**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Phase 3: Software Installation
Run these commands to install the core stack:

### 1. PHP 8.2 & Extensions
```bash
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip php8.2-bcmath php8.2-intl php8.2-redis
```

### 2. Nginx, MySQL & Redis
```bash
sudo apt install -y nginx mysql-server redis-server
```

### 3. Node.js (for Vite/React)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. Python Environment
```bash
sudo apt install -y python3-pip python3-venv
```

---

## Phase 4: Application Deployment

### 1. Clone & Install
```bash
cd /var/www
git clone https://github.com/your-username/stegolock.git
cd stegolock
composer install --optimize-autoloader --no-dev
npm install
npm run build
```

### 2. Python Setup
```bash
cd python_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### 3. Environment Configuration
1. Create your environment file: `cp .env.example .env`
2. Edit `.env`: `nano .env`
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Set `APP_URL=https://your-domain.com`
   - Fill in `DB_*` and `B2_*` credentials.
3. Finalize Laravel:
   ```bash
   php artisan key:generate
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   ```

---

## Phase 5: Operation & Security

### 1. Permissions
```bash
sudo chown -R www-data:www-data /var/www/stegolock/storage
sudo chown -R www-data:www-data /var/www/stegolock/bootstrap/cache
sudo chmod -R 775 /var/www/stegolock/storage
```

### 2. Supervisor (Queue Worker)
Create `/etc/supervisor/conf.d/stegolock.conf`:
```ini
[program:stegolock-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/stegolock/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/stegolock/storage/logs/worker.log
```
Activate it:
```bash
sudo supervisorctl update
sudo supervisorctl start all
```

### 3. Nginx SSL (Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Phase 6: Final Verification
1. Visit your domain and ensure the site loads.
2. Upload a small image file and "Lock" it.
3. Check `storage/logs/worker.log` to ensure the Python script executed without path errors.
4. Verify the file appears in your Backblaze B2 bucket.
