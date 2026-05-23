// backend/models/Income.js
const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    customer: {
      type: String,
      default: "",
    },
    source: {
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
        "sales",
        "service",
        "consulting",
        "rental",
        "interest",
        "dividend",
        "commission",
        "freelance",
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
    status: {
      type: String,
      enum: ["received", "pending", "cancelled"],
      default: "received",
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

module.exports = mongoose.model("Income", incomeSchema);