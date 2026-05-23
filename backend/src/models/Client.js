// backend/src/models/Client.js
const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Basic Info
  clientName: {  // Changed from client_name to clientName
    type: String,
    required: true
  },
  companyName: {  // Changed from company_name to companyName
    type: String,
    required: true
  },
  clientDesignation: String,  // Changed from client_designation
  companyAddress: String,     // Changed from company_address
  city: String,
  phone: String,
  email: String,
  gstin: String,
  
  // New Fields for Enhanced Features
  category: {
    type: String,
    enum: ["premium", "regular", "lead", "inactive", "prospect"],
    default: "regular"
  },
  
  tags: [{
    type: String
  }],
  
  notes: String,
  
  followUpDate: Date,
  followUpNotes: String,
  
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    fileType: String
  }],
  
  communicationLogs: [{
    type: {
      type: String,
      enum: ["email", "call", "meeting", "message"]
    },
    date: {
      type: Date,
      default: Date.now
    },
    summary: String,
    notes: String,
    followUpNeeded: Boolean
  }],
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field on save
ClientSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Client", ClientSchema);