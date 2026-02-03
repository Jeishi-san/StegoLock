# SETUP after git clone
1. cd stegolock_backend
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
7. php artisan serve
