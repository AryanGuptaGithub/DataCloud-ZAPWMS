// backend/models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    vendor: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      enum: [
        "food",
        "travel",
        "utilities",
        "shopping",
        "entertainment",
        "office",
        "rent",
        "salary",
        "marketing",
        "maintenance",
        "software",
        "other",
      ],
      default: "other",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank", "online", "check"],
      default: "cash",
    },
    notes: {
      type: String,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Expense", expenseSchema);