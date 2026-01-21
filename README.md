# Edu-Desk

A full-stack educational platform for sharing and managing study materials.

## 🎯 Overview

Edu-Desk is a production-ready MVP that allows students and educators to upload, manage, browse, and interact with study materials (PDFs/notes). The platform supports authentication, file uploads, PDF viewing, community interaction (comments, ratings, favorites), and a basic analytics dashboard.

## ✨ Features

### Core Features
- **User Authentication** - Email/password registration and login with JWT
- **PDF Upload & Management** - Upload PDF files with title and description
- **PDF Viewer** - View uploaded PDFs directly in browser
- **Community Features** - Comments, ratings (1-5 stars), and favorites
- **Dashboard Analytics** - Basic user statistics and activity tracking
- **Responsive Design** - Mobile-first design with Tailwind CSS

### Pages & Routes
- `/` - Home/Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard with analytics
- `/upload` - Upload new notes
- `/notes` - Browse all notes
- `/notes/:id` - View specific note with PDF viewer and comments
- `/profile` - User profile management

## 🛠 Tech Stack

- **Frontend:** React 18 + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (production-ready for MVP)
- **Authentication:** JWT with bcrypt
- **File Storage:** Local storage with multer
- **Security:** Helmet, CORS, rate limiting
- **Icons:** Lucide React

## 🚀 Quick Start

### Option 1: Using Batch Files (Windows)
```bash
# Install dependencies
install.bat

# Start the application
start.bat
```

### Option 2: Manual Setup
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Start development servers
npm run dev
```

### Option 3: Individual Commands
```bash
# Terminal 1 - Start backend server
cd server && npm run dev

# Terminal 2 - Start frontend
cd client && npm start
```

## 🌐 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 📁 Project Structure

```
edu-desk/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Page components
│   │   └── index.css      # Tailwind CSS styles
│   └── package.json
├── server/                # Node.js backend application
│   ├── database/          # Database initialization
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route handlers
│   └── index.js          # Server entry point
├── uploads/              # File storage directory
├── database.db           # SQLite database file
├── install.bat           # Windows installation script
├── start.bat            # Windows startup script
└── README.md
```

## 📊 Database Schema

### Users
- `id`, `email`, `name`, `password`, `created_at`

### Notes
- `id`, `title`, `description`, `file_url`, `file_name`, `uploaded_by`, `created_at`

### Comments
- `id`, `note_id`, `user_id`, `text`, `created_at`

### Ratings
- `id`, `note_id`, `user_id`, `rating`, `created_at`
- Unique constraint on `(note_id, user_id)`

### Favorites
- `id`, `user_id`, `note_id`, `created_at`
- Unique constraint on `(user_id, note_id)`

## 🔧 Configuration

### Environment Variables
Copy `server/.env.example` to `server/.env` and configure:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=../database.db
UPLOAD_DIR=../uploads
MAX_FILE_SIZE=10485760
CORS_ORIGINS=http://localhost:3000
```

### File Upload Limits
- Maximum file size: 10MB
- Allowed file types: PDF only
- Storage: Local filesystem (configurable for cloud storage)

## 🔒 Security Features

- JWT authentication with secure token handling
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- File type validation
- SQL injection prevention

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive navigation with mobile menu
- Card-based layouts that work on all screen sizes
- Touch-friendly interface elements

## 🎨 UI/UX Features

- Clean, modern educational-focused design
- Primary color: Blue/Indigo theme
- Smooth hover transitions
- Loading states and error handling
- Intuitive navigation and user flows
- Accessibility considerations

## 📚 Documentation

- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

## 🧪 Testing Setup

Run the setup verification:
```bash
node test-setup.js
```

## 🚀 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions including:
- VPS/Server deployment
- Heroku deployment
- Docker deployment
- Database migration options
- Security checklist

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review the API reference
3. Check existing issues
4. Create a new issue with detailed information

---

**Built with ❤️ for the educational community**