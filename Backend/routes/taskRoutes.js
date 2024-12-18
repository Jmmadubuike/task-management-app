const express = require("express");
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  markTaskAsCompleted,
  deleteTask,
} = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Route to create a new task
router.post("/", authMiddleware, createTask);

// Route to get all tasks for the authenticated user
router.get("/", authMiddleware, getAllTasks);

// Route to get a specific task by ID
router.get("/:id", authMiddleware, getTaskById);

// Route to update a task by ID (including marking as completed)
router.put("/:id", authMiddleware, updateTask);

// Route to mark a task as completed
router.patch("/:id/completed", authMiddleware, markTaskAsCompleted);

// Route to delete a task by ID
router.delete("/:id", authMiddleware, deleteTask);

module.exports = router;
