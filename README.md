# SETUP after git clone
1. cd stegolock
2. composer install
3. copy .env.example .env
4. edit .env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=stegolock_app
   DB_USERNAME=root
   DB_PASSWORD=

5. php artisan migrate
6. php artisan key:generate

7. npm install react react-dom
8. npm install --save-dev @vitejs/plugin-react
9. composer require inertiajs/inertia-laravel

10. npm install @inertiajs/react
11. npm install lucide-react
12. npm install tailwindcss @tailwindcss/vite
13. npm install sonner
14. npm install tw-animate-css

15. php artisan serve
16. npm run dev


## to code
- admin view
- users must not be able to preview file content when its "Secured"

### During Cloud Integ
- composer require league/flysystem-aws-s3-v3 "^3.0"
