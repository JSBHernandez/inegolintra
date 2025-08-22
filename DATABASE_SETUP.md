# Legal Case Management System

A web application for managing legal client cases built with Next.js 15.4.6, TypeScript, Tailwind CSS, and Prisma ORM.

## Features

- Register client cases with the following information:
  - Client Name
  - Case Type (Criminal Defense, Civil Litigation, Family Law, etc.)
  - Notes
  - Total Contract Amount
  - Automatic timestamp recording

- View all registered cases in a responsive table
- Real-time form validation
- MySQL database integration via Hostinger

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Configuration

1. Update the `.env` file with your Hostinger MySQL credentials:

```env
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
```

Replace:
- `username`: Your MySQL username
- `password`: Your MySQL password  
- `hostname`: Your Hostinger MySQL hostname
- `database_name`: Your database name

### 3. Database Migration

Run the following command to create the database tables:

```bash
npx prisma db push
```

This will create the `client_cases` table with the following structure:
- `id` (Primary Key, Auto Increment)
- `clientName` (VARCHAR(255))
- `caseType` (VARCHAR(100))
- `notes` (TEXT, Optional)
- `totalContract` (DECIMAL(10,2))
- `createdAt` (DATETIME, Auto-generated)
- `updatedAt` (DATETIME, Auto-updated)

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── client-cases/
│   │       └── route.ts          # API endpoints for CRUD operations
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page component
├── components/
│   ├── ClientCaseForm.tsx       # Form for registering new cases
│   └── ClientCasesList.tsx      # Component for displaying cases list
└── lib/
    ├── db.ts                    # Prisma client configuration
    └── validations.ts           # Zod validation schemas

prisma/
└── schema.prisma                # Database schema definition
```

## API Endpoints

### POST /api/client-cases
Register a new client case.

**Request Body:**
```json
{
  "clientName": "John Doe",
  "caseType": "Criminal Defense",
  "notes": "Initial consultation completed",
  "totalContract": 5000.00
}
```

### GET /api/client-cases
Retrieve all client cases, ordered by creation date (newest first).

## Technologies Used

- **Next.js 15.4.6** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma ORM** - Database operations
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **MySQL** - Database (hosted on Hostinger)

## Database Schema

The application uses a single table `client_cases` with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | INT PRIMARY KEY | Auto-incrementing ID |
| clientName | VARCHAR(255) | Client's full name |
| caseType | VARCHAR(100) | Type of legal case |
| notes | TEXT | Optional case notes |
| totalContract | DECIMAL(10,2) | Contract amount in dollars |
| createdAt | DATETIME | Record creation timestamp |
| updatedAt | DATETIME | Record update timestamp |

## Future Enhancements

- User authentication system
- Case status tracking
- Document upload functionality
- Client contact information
- Billing and payment tracking
- Search and filter capabilities
- Export functionality (PDF, Excel)
