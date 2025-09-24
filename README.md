# Inegol Intranet System

A comprehensive intranet web application for Inegol immigration law firm built with Next.js 15.4.6, TypeScript, Tailwind CSS, and Prisma ORM. This system manages client cases, user administration, news, HR processes, training modules, and more.

## Features

### 🏠 **Dashboard & Authentication**
- Secure login system with role-based access (Admin/Agent)
- Password change enforcement for new users
- Personalized dashboard with latest news and quick stats
- Session management with automatic logout

### 👥 **Client Portal**
- Register client cases with comprehensive information (name, case type, status, notes, contract amounts)
- Dynamic paralegal assignment with management system
- Advanced filtering by status, paralegal, and client name
- Case notes system for detailed tracking
- Responsive table view with sorting and pagination
- Real-time search and autocomplete suggestions

### 📰 **News Management**
- Create, edit, and manage company news articles
- Image upload support with Base64 encoding for serverless deployment
- Active/inactive status control
- Rich content editor with image previews
- Vertical card layout for better readability

### 👤 **User Management** (Admin Only)
- Create and manage user accounts
- Role assignment (Administrator/Agent)
- User activation/deactivation
- Profile management with personal information
- Profile photo upload capability

### 📋 **Human Resources Module**
- Permission request system (vacation, sick leave, PTO, etc.)
- Incident reporting with priority levels and image attachments
- Request status tracking and management
- Date validation and conflict prevention

### 📚 **Training System**
- Training module creation and management
- Category-based organization (Visas, Immigration Law, Customer Service, etc.)
- Progress tracking for employees
- Interactive content delivery

### 🛂 **Immigration News**
- Curated immigration law updates
- External news integration
- Category filtering and search

### ⚙️ **Dynamic Paralegal Management**
- Add new paralegals to the system
- Activate/deactivate paralegals without affecting existing case data
- Dynamic dropdown updates across all forms
- Data preservation for historical records

### 🔍 **Global Search**
- Search across all modules and data types
- Quick access to cases, users, and documents

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database (Hostinger or compatible)
- NPM or Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JSBHernandez/inegolintra.git
cd inegolintra
```

2. Install dependencies:
```bash
npm install
```

3. Configure your environment variables in `.env`:
```env
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data (paralegals)
node scripts/seed-paralegals.js
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to view the application.


## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Configuration
Ensure all environment variables are properly set for production:
- Database connection string
- Authentication secrets
- Image upload configurations

## Technologies Used

### **Frontend**
- **Next.js 15.4.6** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation library

### **Backend & Database**
- **Prisma ORM** - Database toolkit and ORM
- **MySQL** - Primary database (Hostinger)
- **NextAuth.js** - Authentication solution
- **bcryptjs** - Password hashing

### **File Management**
- **Base64 Encoding** - Image storage for serverless compatibility
- **Multer** - File upload handling
- **Image Processing** - Client-side image optimization

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking
- **Turbopack** - Fast bundler for development

### **UI/UX**
- **Responsive Design** - Mobile-first approach
- **Modern Card Layouts** - Professional appearance
- **Interactive Components** - Rich user experience
- **Loading States** - Smooth user feedback

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── client-cases/  # Client case management
│   │   ├── news/          # News management
│   │   ├── paralegals/    # Paralegal management
│   │   └── upload-photo/  # Image upload handling
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ClientPortal.tsx   # Client case management
│   ├── NewsManagement.tsx # News system
│   ├── ParalegalManager.tsx # Paralegal management
│   ├── UserManagement.tsx # User administration
│   └── ...               # Other components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   └── validations.ts    # Zod schemas
├── types/                 # TypeScript type definitions
└── ...
```

## Key Features Detail

### **Security**
- Role-based access control
- Password hashing with bcrypt
- Session management
- Input validation and sanitization

### **Data Management**
- Real-time CRUD operations
- Advanced filtering and search
- Data export capabilities
- Audit trails for important actions

### **User Experience**
- Intuitive navigation
- Responsive design for all devices
- Fast loading with optimized images
- Error handling with user-friendly messages

### **Scalability**
- Serverless-ready architecture
- Optimized database queries
- Efficient state management
- Modular component structure

## Database Schema

The system uses a comprehensive database schema including:
- **Users** - Authentication and profile management
- **Client Cases** - Legal case tracking
- **News** - Company communications
- **Paralegals** - Dynamic staff management
- **Training Modules** - Employee development
- **HR Requests** - Permission and incident tracking

For detailed database setup instructions, see `DATABASE_SETUP.md`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For technical support or questions about the system:
- Review the documentation
- Check the database setup guide
- Ensure all environment variables are configured
- Verify database connectivity

## License

This project is proprietary software developed for Inegol immigration law firm.
