const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getPolygons,
  addPolygon,
  updatePolygon,
  deletePolygon,
} = require("../controllers/polygonController");

const router = express.Router();

// Fetch all polygons
router.get("/", protect, getPolygons);

// Add a new polygon
router.post("/", protect, addPolygon);

// Update an existing polygon
router.put("/:id", protect, updatePolygon);

// Delete a polygon
router.delete("/:id", protect, deletePolygon);

module.exports = router;
