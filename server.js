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

const bucket = admin.storage().bucket();
module.exports = { bucket }; // Export the bucket for use in upload.js

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://btms-8eqb.vercel.app' : 'http://localhost:3000', // Remove trailing slash
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  credentials: true, // Enable credentials (if needed for cookies or authentication)
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
app.use('/api/tanods', tanodRatingRoutes); // Add this line for Tanod ratings

app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'An unexpected error occurred', error: err.message });
});

// // Start server
// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// // Graceful shutdown on SIGTERM
// process.on('SIGTERM', () => {
//   server.close(() => console.log('Process terminated'));
// });
