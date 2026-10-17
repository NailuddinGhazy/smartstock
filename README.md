
# SmartStock POS

SmartStock POS is a web-based Point of Sale (POS) application built to manage products, inventory, and sales transactions.

## Features

- **Dashboard** — Displays business and sales information.
- **Product Management** — Manages product data and categories.
- **Inventory Management** — Tracks product stock.
- **Sales Transactions** — Records sales and transaction details.
- **Transaction History** — Displays recorded sales transactions.
- **Reports** — Provides sales-related information.
- **Authentication** — Provides login and logout functionality.

## Tech Stack

### Frontend
- React 19
- Vite
- JavaScript
- CSS
- Lucide React
- Recharts

### Backend
- PHP 8.3
- Laravel 13
- Laravel Sanctum
- MySQL

## Project Structure

```text
smartstock/
├── backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   ├── .env.example
│   └── README.md
├── smartstock/
│   └── frontend/
│       ├── public/
│       ├── src/
│       ├── package.json
│       └── vite.config.js
└── README.md
```

## Requirements

Make sure the following tools are installed:

- PHP 8.3 or a compatible version
- Composer
- Node.js and npm
- MySQL
- Git

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NailuddinGhazy/smartstock.git
cd smartstock
```

### 2. Install Backend Dependencies

Open a terminal in the backend directory:

```powershell
cd backend
composer install
Copy-Item .env.example .env
```

### 3. Configure the Backend Environment

Open `backend/.env` and configure the application and database settings.

Use the following configuration for a local MySQL setup:

```dotenv
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smartstock
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_DOMAIN=null
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,127.0.0.1:5173,127.0.0.1:8000
```

Adjust the database username and password according to your local MySQL configuration. If `SANCTUM_STATEFUL_DOMAINS` is not present in `.env`, add it.

Create a MySQL database named `smartstock` before running the migrations.

### 4. Generate the Application Key

From the backend directory, run:

```bash
php artisan key:generate
```

### 5. Run Database Migrations

Run the following command from the backend directory:

```bash
php artisan migrate
```

Laravel migrations create the database tables required by the application, including users, sessions, products, transactions, and transaction details.

### 6. Create a User Account

The migrations create the `users` table but do not automatically create an administrator account.

To create a user account, open Laravel Tinker from the backend directory:

```bash
php artisan tinker
```

Execute the following PHP code inside Tinker:

```php
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => 'GantiPasswordKamu123!',
]);
```

Replace the example name, email, and password with your own values. Make sure the email address has not already been registered and use a strong password.

The User model automatically hashes the password before saving it to the database.

Exit Tinker:

```php
exit
```

### 7. Start the Backend Server

From the backend directory, run:

```bash
php artisan serve
```

The backend server will be available at:

`http://localhost:8000`

### 8. Install Frontend Dependencies

Open a new terminal from the repository root:

```powershell
cd smartstock/frontend
npm install
```

### 9. Start the Frontend Server

From the frontend directory, run:

```bash
npm run dev
```

The frontend will be available at:

`http://localhost:5173`

Open this URL in your browser to access SmartStock POS.

## Authentication

SmartStock uses Laravel authentication for login and logout functionality. Laravel Sanctum supports session-based authentication for protected API endpoints.

For local development, the frontend and backend run on separate development servers. The frontend origin must be allowed by the backend CORS configuration, and the frontend and backend domains must be configured correctly for Sanctum.

## Development Notes

- Keep `backend/.env` private and do not commit credentials or application secrets.
- The frontend communicates with the backend using the Fetch API.
- Database structure is managed through Laravel migrations.
- The root `README.md` documents the SmartStock project.
- The `backend/README.md` remains the default Laravel documentation.

## License

No project-specific license has been specified.
