// backend/controllers/expenseController.js
const Expense = require("../models/Expense");

// GET /expenses
exports.listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({
      date: -1,
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /expenses
exports.createExpense = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.title || !req.body.amount) {
      return res.status(400).json({ message: "Title and amount are required" });
    }

    const expense = await Expense.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json(expense);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating expense", error: error.message });
  }
};

// PUT /expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating expense", error: error.message });
  }
};

// DELETE /expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Bulk import expenses
exports.bulkImport = async (req, res) => {
  try {
    const expenses = req.body; // Array of expense objects
    const userId = req.user._id;

    // Add user ID to each expense
    const expensesWithUser = expenses.map((expense) => ({
      ...expense,
      user: userId,
    }));

    // Insert all expenses
    const createdExpenses = await Expense.insertMany(expensesWithUser);
    res.status(201).json({
      message: "Expenses imported successfully",
      count: createdExpenses.length,
      expenses: createdExpenses,
    });
  } catch (error) {
    res.status(400).json({ message: "Import failed", error: error.message });
  }
};
