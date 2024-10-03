// authController.js
const User = require("../models/User");
const Equipment = require("../models/Equipment");
const TanodRating = require("../models/Rating");
const Schedule = require("../models/Schedule");
const Notification = require('../models/Notification');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { bucket } = require("../config/firebaseAdmin");

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Register a new user
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, username, email, password, userType, ...rest } =
    req.body;

  try {
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      userType,
      ...rest,
    });
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Register a new Tanod
exports.registerTanod = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const {
    firstName,
    middleName,
    lastName,
    email,
    username,
    password,
    userType,
  } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: "Username already exists" });

    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      username,
      password,
      userType,
    });
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      middleName: user.middleName,
      email: user.email,
      lastName: user.lastName,
      username: user.username,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//delete a user
exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all user profiles
exports.getAllUserProfiles = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    if (!users.length)
      return res.status(404).json({ message: "No users found" });

    // Return the user data
    res.json(users);
  } catch (error) {
    console.error("Error fetching all user profiles:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get current user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    Object.assign(user, req.body);
    if (req.file) user.profilePicture = req.file.filename;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginResident = async (req, res) => {
  const { email, password } = req.body; // Extract email and password from request body
  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Verify password and user type
    if (
      user &&
      (await bcrypt.compare(password, user.password)) &&
      user.userType === "resident"
    ) {
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        token: generateToken(user._id), // Use the generateToken function
        profilePicture: user.profilePicture,
      });
    }

    // Invalid credentials
    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginTanod = async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body
  try {
    const user = await User.findOne({ username }); // Find user by username

    // Verify password and user type
    if (
      (user &&
        (await bcrypt.compare(password, user.password)) &&
        user.userType === "tanod") ||
      user.userType === "admin"
    ) {
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        token: generateToken(user._id), // Use the generateToken function
        profilePicture: user.profilePicture,
      });
    }

    // Invalid credentials
    res.status(401).json({ message: "Invalid username or password" });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10); // Hash new password
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to add equipment
exports.addEquipment = async (req, res) => {
  const { name, borrowDate, returnDate, imageUrl } = req.body;

  try {
    const newEquipment = new Equipment({
      name,
      borrowDate,
      returnDate,
      imageUrl,
      user: req.user.id, // Assuming user is authenticated
    });

    const savedEquipment = await newEquipment.save();
    res.status(201).json(savedEquipment);
  } catch (error) {
    console.error("Error saving equipment:", error);
    res.status(500).json({ message: "Error saving equipment" });
  }
};

// Function to get all equipment
exports.getEquipments = async (req, res) => {
  try {
    const equipments = await Equipment.find({ user: req.user._id }).populate(
      "user",
      "firstName lastName"
    );
    res.status(200).json(equipments);
  } catch (error) {
    console.error("Error fetching equipments:", error);
    res.status(500).json({ message: "Error fetching equipments" });
  }
};

// Update equipment by ID
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    equipment.returnDate = req.body.returnDate; // Update return date
    const updatedEquipment = await equipment.save();

    res.json(updatedEquipment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Rate and edit rating tanod
exports.rateTanod = async (req, res) => {
  const { tanodId } = req.params;
  const { rating, comment, ratingId } = req.body; // Accept `ratingId` for editing

  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating or comment" });
  }

  try {
    // If `ratingId` is provided, update the existing rating
    if (ratingId) {
      const existingRating = await TanodRating.findById(ratingId);
      if (!existingRating) {
        return res.status(404).json({ message: "Rating not found" });
      }

      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
      return res.status(200).json({
        message: "Rating updated successfully",
        updatedRating: existingRating,
      });
    }

    // Create a new rating if `ratingId` is not provided
    const newRating = new TanodRating({
      tanodId,
      userId: req.user._id,
      rating,
      comment,
    });

    await newRating.save();
    return res
      .status(201)
      .json({ message: "Rating submitted successfully", newRating });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
  }
};

// Get ratings by the logged-in user
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await TanodRating.find({ userId: req.user._id }).populate(
      "tanodId",
      "firstName lastName"
    );

    if (!ratings.length) {
      return res.status(404).json({ message: "No ratings found" });
    }

    res.json(ratings);
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete rating by the logged-in user
exports.deleteRating = async (req, res) => {
  try {
    const rating = await TanodRating.findOneAndDelete({
      _id: req.params.ratingId,
      userId: req.user._id,
    });

    if (!rating) {
      return res.status(404).json({
        message:
          "Rating not found or you do not have permission to delete this rating",
      });
    }

    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Tanod ratings
exports.getTanodRatings = async (req, res) => {
  const { tanodId } = req.params;

  try {
    const ratings = await TanodRating.find({ tanodId })
      .populate("userId", "firstName lastName") // Populate userId with firstName and lastName
      .select("rating comment createdAt userId"); // Select fields

    if (!ratings.length) {
      return res
        .status(404)
        .json({ message: "No ratings found for this Tanod." });
    }

    const overallRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingCounts = [0, 0, 0, 0, 0]; // For ratings 1-5

    ratings.forEach((r) => {
      ratingCounts[r.rating - 1]++;
    });

    // Map the ratings to include userId and comment
    const commentsWithUser = ratings.map((r) => ({
      userId: r.userId._id, // Include the user's ID
      fullName: `${r.userId.firstName} ${r.userId.lastName}`, // Construct full name
      comment: r.comment, // Comment
    }));

    res.json({
      overallRating: overallRating.toFixed(1), // Round to one decimal
      ratingCounts,
      comments: commentsWithUser, // Return the structured comments
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching ratings", error: error.message });
  }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
  const { unit, tanods, startTime, endTime } = req.body;

  try {
    if (!unit || !tanods || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the schedule
    const schedule = new Schedule({
      unit,
      tanods,
      startTime,
      endTime,
    });

    await schedule.save();

    // Create a notification for each Tanod in the schedule
    const notifications = tanods.map(tanodId => ({
      userId: tanodId,
      message: `You have new patrol schedule!, your group is ${unit}.`,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ message: "Schedule created successfully", schedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().populate(
      "tanods",
      "firstName lastName"
    ); // Populate Tanod names
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId).populate(
      "tanods",
      "firstName lastName"
    );
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  const { unit, tanods, startTime, endTime } = req.body;

  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Update schedule fields
    schedule.unit = unit || schedule.unit;
    schedule.tanods = tanods || schedule.tanods;
    schedule.startTime = startTime || schedule.startTime;
    schedule.endTime = endTime || schedule.endTime;

    await schedule.save();
    
    const notifications = tanods.map(tanodId => ({
      userId: tanodId,
      message: `Your patrol schedule has been updated!`,
    }));

    await Notification.insertMany(notifications);

    res
      .status(200)
      .json({ message: "Schedule updated successfully", schedule });
  } catch (error) {
    console.error("Error updating schedule:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch members of a specific schedule
exports.getScheduleMembers = async (req, res) => {
  const { id } = req.params;

  try {
    // Populate additional fields like profilePicture and contactNumber
    const schedule = await Schedule.findById(id).populate(
      "tanods",
      "firstName lastName profilePicture contactNumber"
    );
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

    res.status(200).json({ tanods: schedule.tanods });
  } catch (error) {
    console.error("Error fetching schedule members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch schedules for a specific Tanod
exports.getSchedulesForTanod = async (req, res) => {
  const { userId } = req.params;

  try {
    const schedules = await Schedule.find({ tanods: userId }).populate(
      "tanods",
      "firstName lastName profilePicture contactNumber"
    );
    if (!schedules.length) {
      return res
        .status(404)
        .json({ message: "No schedules found for this Tanod." });
    }
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules for Tanod:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
