const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');

dotenv.config();
const app = express();
connectDB();

// Firebase Admin Setup
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://btms-8eqb.vercel.app' : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Equipment Routes
const equipmentRoutes = require('./routes/authEquipment');
app.use('/api/equipments', equipmentRoutes);

// Tanod Rating Routes
const tanodRatingRoutes = require('./routes/authRoutes');
app.use('/api/tanods', tanodRatingRoutes);

// Notifications and Messages Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'An unexpected error occurred', error: err.message });
});

// Export the app for Vercel
module.exports = app; // Change this line to export the app directly
