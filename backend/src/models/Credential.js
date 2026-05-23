// backend/src/models/Credential.js
const mongoose = require("mongoose");

/* ── Renewal history entry ─────────────────── */
const RenewalSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    duration: { type: Number, required: true }, // years
    cost: { type: Number, default: null }, // optional ₹
    notes: { type: String, default: "" },
  },
  { _id: true, timestamps: false },
);

/* ── Domain-mapping entry (for hosting) ────── */
const DomainMappingSchema = new mongoose.Schema(
  {
    domain: { type: String, default: "" },
    type: { type: String, enum: ["main", "subdomain"], default: "main" },
    records: {
      A: { type: [String], default: [] },
      CNAME: { type: [String], default: [] },
      MX: { type: [String], default: [] },
      TXT: { type: [String], default: [] },
    },
  },
  { _id: true },
);

/* ── Meta sub-document ─────────────────────── */
const MetaSchema = new mongoose.Schema(
  {
    start_date: { type: Date, default: null },
    renewal_history: { type: [RenewalSchema], default: [] },

    // Domain-specific
    nameservers: { type: [String], default: [] },

    // Hosting-specific
    ip_address: { type: String, default: "" },
    server_details: { type: String, default: "" },

    dns_details: {
      nameservers: { type: [String], default: [] },
      A: { type: [String], default: [] },
      CNAME: { type: [String], default: [] },
      MX: { type: [String], default: [] },
      TXT: { type: [String], default: [] },
    },

    domains: { type: [DomainMappingSchema], default: [] },

    panel: {
      url: { type: String, default: "" },
      username: { type: String, default: "" },
      password: { type: String, default: "" },
    },
  },
  { _id: false },
);

/* ── Service sub-document ──────────────────── */
const ServiceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["domain", "hosting"],
      required: true,
      lowercase: true,
    },
    service_name: { type: String, required: true, trim: true },
    provider: { type: String, trim: true, default: "" },
    portal_url: { type: String, trim: true, default: "" },
    login: { type: String, trim: true, default: "admin" },
    password: { type: String, default: "" },
    expiry: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
    meta: { type: MetaSchema, default: () => ({}) },
  },
  { _id: true, timestamps: true },
);

/* ── Client (Credential) document ─────────── */
const CredentialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * customer_id — hard reference to the Client model (Customers page).
     * Optional: credentials added via free-text fallback won't have this set.
     */
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    client_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    services: { type: [ServiceSchema], default: [] },
  },
  { timestamps: true },
);

CredentialSchema.index({ user: 1, client_name: 1 }, { unique: true });

module.exports = mongoose.model("Credential", CredentialSchema);
