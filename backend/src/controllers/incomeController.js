// backend/controllers/incomeController.js
const Income = require("../models/Income");

// GET /incomes
exports.listIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user._id }).sort({
      date: -1,
    });

    // Ensure all fields are present with defaults
    const formattedIncomes = incomes.map((income) => ({
      ...income.toObject(),
      customer: income.customer || "",
      source: income.source || "",
      category: income.category || "other",
      paymentMethod: income.paymentMethod || "cash",
      status: income.status || "received",
    }));

    res.json(formattedIncomes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /incomes
exports.createIncome = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.title || !req.body.amount) {
      return res.status(400).json({ message: "Title and amount are required" });
    }

    const income = await Income.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json(income);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating income", error: error.message });
  }
};

// PUT /incomes/:id
exports.updateIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.json(income);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating income", error: error.message });
  }
};

// DELETE /incomes/:id
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Bulk import incomes
exports.bulkImport = async (req, res) => {
  try {
    const incomes = req.body; // Array of income objects
    const userId = req.user._id;

    // Add user ID to each income
    const incomesWithUser = incomes.map((income) => ({
      ...income,
      user: userId,
    }));

    // Insert all incomes
    const createdIncomes = await Income.insertMany(incomesWithUser);
    res.status(201).json({
      message: "Incomes imported successfully",
      count: createdIncomes.length,
      incomes: createdIncomes,
    });
  } catch (error) {
    res.status(400).json({ message: "Import failed", error: error.message });
  }
};
