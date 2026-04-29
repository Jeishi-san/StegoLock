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
   ```bash
   # Create environment file
   copy .env.example .env

   # Generate application key
   php artisan key:generate
   ```

3. **Database Configuration**
   - Create a new database named `stegolock_app` in your MySQL server.
   - Update your `.env` file with your credentials:
     ```env
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=stegolock_app
     DB_USERNAME=root
     DB_PASSWORD=
     ```

4. **Initialize Database**
   ```bash
   # Run migrations to build tables
   php artisan migrate
   ```

5. **Seed the Database**
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
| **Standard User** | `user@example.com` |

### Running the Application
Run both commands in separate terminal tabs to start the backend and frontend dev servers:
```bash
# Terminal 1: Backend
php artisan serve

# Terminal 2: Frontend (Vite)
npm run dev
```

---

