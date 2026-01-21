// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const usersRoutes = require('./routes/users');
const academicsRoutes = require('./routes/academics');
const migrationRoutes = require('./routes/migration');
const { initDatabase } = require('./database/init');

// Initialize cloud services
const { initializeFirebase } = require('./services/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist (for backward compatibility)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database (SQLite for backward compatibility during migration)
initDatabase();

// Initialize Firebase services
const firebaseInitialized = initializeFirebase();
if (firebaseInitialized) {
  console.log('Cloud services initialized successfully');
  
  // Seed academic data in Firestore
  const { seedAcademicData } = require('./services/seedData');
  seedAcademicData().catch(error => {
    console.error('Failed to seed academic data:', error.message);
  });
} else {
  console.log('Firebase not configured, using SQLite for backward compatibility');
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false, // Set to true if behind a proxy
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/academics', academicsRoutes);
app.use('/api/migration', migrationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;