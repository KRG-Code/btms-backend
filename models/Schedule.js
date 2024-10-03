// schedule.js (Model)
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  unit: {
    type: String,
    required: true,
    enum: ["Unit 1", "Unit 2", "Unit 3"], // Only allow these 3 units
  },
  tanods: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Referencing the User (Tanod)
      required: true,
    },
  ],
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Schedule", scheduleSchema);
