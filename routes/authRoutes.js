// authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  registerTanod,
  loginResident,
  loginTanod,
  getUserProfile,
  updateUserProfile,
  getAllUserProfiles,
  rateTanod,
  getTanodRatings,
  getUserRatings,
  deleteRating,
  deleteUser,
  getEquipments,
  changePassword,
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getSchedulesForTanod,
  getScheduleMembers
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// User registration route
router.post('/register', [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], registerUser);

// Tanod registration route
router.post('/registertanod', [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], registerTanod);

module.exports = router;


router.post('/login/resident', loginResident); // For residents

router.post('/login/tanod', loginTanod); // For Tanods

router.post('/:tanodId/rate', protect, rateTanod); //Upload tanod rating

router.put('/update', protect, updateUserProfile); // Update user profile

router.put('/change-password', protect, changePassword); // Change user password

router.get('/equipments', protect, getEquipments); 

router.get('/:tanodId/ratings', protect, getTanodRatings);// Route to get ratings for a specific Tanod

router.get('/my-ratings', protect, getUserRatings);  // Get current user's ratings

router.get('/users', protect, getAllUserProfiles); //Get all user profile

router.get('/me', protect, getUserProfile); // Get current user profile

router.delete('/ratings/:ratingId', protect, deleteRating);  // Delete a rating

router.delete('/users/:userId', protect, deleteUser); //delete user

// Schedule routes
router.post('/schedule', protect, createSchedule);
router.get('/schedules', protect, getAllSchedules);
router.get('/schedule/:scheduleId', protect, getScheduleById);
router.put('/schedule/:scheduleId', protect, updateSchedule);
router.delete('/schedule/:scheduleId', protect, deleteSchedule);
router.get('/schedule/:id/members', protect, getScheduleMembers);
router.get('/tanod-schedules/:userId', protect, getSchedulesForTanod);




module.exports = router;
