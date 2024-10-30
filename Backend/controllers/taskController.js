const Task = require("../models/Task");
const { body, validationResult } = require("express-validator");

// Create Task with validation
exports.createTask = async (req, res) => {
  await body("title", "Title is required").notEmpty().run(req);
  await body("category", "Category is required").notEmpty().run(req); // Validate category
  await body("deadline", "Invalid date")
    .optional()
    .isISO8601()
    .toDate()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { title, description, category, deadline } = req.body;

  try {
    const task = new Task({
      title,
      description,
      category,
      deadline,
      user: req.user.id,
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
};

// Read All Tasks for a User with Pagination and Sorting (Most Recent First)
exports.getAllTasks = async (req, res) => {
  // Get page and limit from query, default to 1 and 10 respectively
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Fetch tasks for the logged-in user, sort by creation date, apply limit and skip
    const tasks = await Task.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Most recent tasks first
      .limit(limit) // Limit the number of tasks returned
      .skip((page - 1) * limit) // Skip tasks from previous pages
      .exec();

    // Get the total count of tasks for the user to calculate total pages
    const count = await Task.countDocuments({ user: req.user.id });

    // Respond with the paginated tasks, total pages, and current page
    res.status(200).json({
      tasks,
      totalPages: Math.ceil(count / limit), // Total number of pages
      currentPage: page, // Current page number
    });
  } catch (error) {
    // Handle errors and send a 500 response with an error message
    res
      .status(500)
      .json({ message: "Error retrieving tasks", error: error.message });
  }
};

// Read a Single Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving task", error: error.message });
  }
};

// Update Task with Validation
exports.updateTask = async (req, res) => {
  await body("title", "Title is required").notEmpty().run(req);
  await body("deadline", "Invalid date")
    .optional()
    .isISO8601()
    .toDate()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { title, description, category, deadline, completed } = req.body;

  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, description, category, deadline, completed },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
};

// Mark Task as Completed
exports.markTaskAsCompleted = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { completed: true }, // Mark as completed
      { new: true } // Return the updated task
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting task", error: error.message });
  }
};
