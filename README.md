# Stegolock 🔐

Stegolock is a secure document management system featuring steganographic processing and robust access controls.

## 🚀 Getting Started (Local Development)

This project is built with **Laravel 12**, **React**, and **Inertia.js**.

### Prerequisites
- **PHP 8.2+** (PHP 8.5 recommended)
- **Node.js & NPM**
- **MySQL/MariaDB** (via Laragon recommended)
- **Composer**

### Installation Steps

1. **Clone & Install Dependencies**
   ```bash
   # Clone the repository
   git clone <repo-url>
   cd stegolock

   # Install PHP and JS dependencies
   composer install
   npm install
   ```

2. **Environment Setup**

   - Create environment file
     ```bash
     copy .env.example .env
     ```

   - Generate application key
     ```bash
     php artisan key:generate
     ```

   - Generate application share key
     ```bash
     php -r "$e='.env';$k='base64:'.base64_encode(random_bytes(32));$c=file_get_contents($e);file_put_contents($e,strpos($c,'APP_SHARE_KEY=')!==false?preg_replace('/APP_SHARE_KEY=.*/','APP_SHARE_KEY='.$k,$c):$c.PHP_EOL.'APP_SHARE_KEY='.$k);echo 'APP_SHARE_KEY has been set successfully.'.PHP_EOL;"
     ```

   - Update Application Name
     ```env
     APP_NAME=StegoLock
     ```

   - Configure Backblaze B2 Storage. Update with your credentials in `.env`:
      ```env
      B2_KEY_ID=
      B2_APPLICATION_KEY=
      B2_BUCKET_ID=
      B2_BUCKET=
      B2_REGION=
      B2_ENDPOINT=
      ```

   - Create a new database named `stegolock_app` in your MySQL server. Update with your credentials in `.env`:
      ```env
      DB_CONNECTION=mysql
      DB_HOST=127.0.0.1
      DB_PORT=3306
      DB_DATABASE=stegolock_app
      DB_USERNAME=root
      DB_PASSWORD=
      ```

3. **Initialize Database**
   ```bash
   # Run migrations to build tables
   php artisan migrate
   ```

4. **Seed the Database**
   ```bash
   # Populate initial data and admin users
   php artisan db:seed
   ```

### 🔑 Default Credentials (Development)
All default accounts use the password: `password`

| Role | Email |
| :--- | :--- |
| **Superadmin** | `superadmin@stegolock.com` |
| **System Admin** | `system.admin@stegolock.com` |
| **User Admin** | `user.admin@stegolock.com` |
| **Standard User** | `user@example.com` |

### Running the Application
Run these commands in separate terminal tabs to start the backend, frontend, and queue processing:
```bash
# Terminal 1: Backend
php artisan serve

# Terminal 2: Frontend (Vite)
npm run dev

# Terminal 3: Queue Worker
php artisan queue:work
```

---

> [!TIP]
> **For development:** If you want to process locking/unlocking for multiple files simultaneously, you can open more terminals and start additional workers (`php artisan queue:work`). Just be mindful of your local device memory usage.


