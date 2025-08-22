# Legal Case Management System

A web application for managing legal client cases built with Next.js 15.4.6, TypeScript, Tailwind CSS, and Prisma ORM.

## Features

- Register client cases with client information, case types, notes, and contract amounts
- View all registered cases in a responsive table format
- Real-time form validation using React Hook Form and Zod
- MySQL database integration via Hostinger
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database (Hostinger)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your database connection in `.env`:
```env
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
```

3. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Technologies Used

- Next.js 15.4.6
- TypeScript
- Tailwind CSS
- Prisma ORM
- React Hook Form
- Zod validation
- MySQL

For detailed setup instructions, see `DATABASE_SETUP.md`.
