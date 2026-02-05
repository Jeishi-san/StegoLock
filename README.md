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

5. npm install react react-dom
6. npm install --save-dev @vitejs/plugin-react
7. composer require inertiajs/inertia-laravel

8. npm install @inertiajs/react
9. npm install lucide-react

10. php artisan migrate
11. php artisan key:generate
12. php artisan serve

13. npm run dev


