// backend/src/controllers/credentialController.js
const Credential = require("../models/Credential");

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const ALLOWED_SERVICE_FIELDS = [
  "type",
  "service_name",
  "provider",
  "portal_url",
  "login",
  "password",
  "expiry",
  "notes",
  "meta",
];

function buildServiceSet(body) {
  const set = {};
  ALLOWED_SERVICE_FIELDS.forEach((key) => {
    if (body[key] !== undefined) set[`services.$.${key}`] = body[key];
  });
  return set;
}

const LEGACY_SERVICE_FIELDS = [
  "service_name",
  "type",
  "provider",
  "portal_url",
  "login",
  "password",
  "expiry",
  "notes",
];

/* ─────────────────────────────────────────────
   GET /credentials
───────────────────────────────────────────── */
exports.listCredentials = async (req, res) => {
  try {
    const credentials = await Credential.find({ user: req.user._id }).sort({
      client_name: 1,
    });
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /credentials/:clientId
───────────────────────────────────────────── */
exports.getCredential = async (req, res) => {
  try {
    const credential = await Credential.findOne({
      _id: req.params.clientId,
      user: req.user._id,
    });
    if (!credential)
      return res.status(404).json({ error: "Client record not found" });
    res.json(credential);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   POST /credentials
   Body: { client_name, customer_id?, services: [...] }
───────────────────────────────────────────── */
exports.createCredential = async (req, res) => {
  try {
    const { client_name, customer_id, services = [] } = req.body;

    if (!client_name?.trim())
      return res.status(400).json({ error: "client_name is required" });

    const exists = await Credential.findOne({
      user: req.user._id,
      client_name: client_name.trim(),
    });
    if (exists) {
      return res.status(409).json({
        error: `A record for "${client_name.trim()}" already exists.`,
        existingId: exists._id,
      });
    }

    const credential = await Credential.create({
      user: req.user._id,
      client_name: client_name.trim(),
      // Only store customer_id when it's a valid non-empty value
      ...(customer_id ? { customer_id } : {}),
      services,
    });
    res.status(201).json(credential);
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ error: "Client already exists." });
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   PATCH /credentials/:clientId
   Handles:
   1. Update client_name / customer_id (new docs)
   2. Root-level legacy service fields (old docs)
───────────────────────────────────────────── */
exports.updateCredential = async (req, res) => {
  try {
    const update = {};

    if (req.body.client_name) update.client_name = req.body.client_name.trim();

    // Allow linking/unlinking a customer after the fact
    // Pass null explicitly to unlink, a valid id to link
    if (req.body.customer_id !== undefined)
      update.customer_id = req.body.customer_id || null;

    // Legacy root-level service fields
    LEGACY_SERVICE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    if (!Object.keys(update).length)
      return res.status(400).json({ error: "Nothing to update" });

    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.clientId, user: req.user._id },
      update,
      { new: true, runValidators: false },
    );
    if (!credential)
      return res.status(404).json({ error: "Client record not found" });
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /credentials/:clientId
───────────────────────────────────────────── */
exports.deleteCredential = async (req, res) => {
  try {
    const credential = await Credential.findOneAndDelete({
      _id: req.params.clientId,
      user: req.user._id,
    });
    if (!credential)
      return res.status(404).json({ error: "Client record not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   POST /credentials/:clientId/services
   Body: { services: [...] }  OR single service object
───────────────────────────────────────────── */
exports.addServices = async (req, res) => {
  try {
    let newServices = req.body.services || req.body;
    if (!Array.isArray(newServices)) newServices = [newServices];

    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.clientId, user: req.user._id },
      { $push: { services: { $each: newServices } } },
      { new: true, runValidators: true },
    );
    if (!credential)
      return res.status(404).json({ error: "Client record not found" });
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   PUT /credentials/:clientId/services/:serviceId
───────────────────────────────────────────── */
exports.updateService = async (req, res) => {
  try {
    const { clientId, serviceId } = req.params;
    const setFields = buildServiceSet(req.body);

    if (!Object.keys(setFields).length)
      return res.status(400).json({ error: "No valid fields to update" });

    const credential = await Credential.findOneAndUpdate(
      { _id: clientId, user: req.user._id, "services._id": serviceId },
      { $set: setFields },
      { new: true, runValidators: true },
    );
    if (!credential)
      return res.status(404).json({ error: "Service not found" });
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /credentials/:clientId/services/:serviceId
───────────────────────────────────────────── */
exports.deleteService = async (req, res) => {
  try {
    const { clientId, serviceId } = req.params;
    const credential = await Credential.findOneAndUpdate(
      { _id: clientId, user: req.user._id },
      { $pull: { services: { _id: serviceId } } },
      { new: true },
    );
    if (!credential)
      return res.status(404).json({ error: "Client record not found" });

    if (credential.services.length === 0) {
      await Credential.findByIdAndDelete(clientId);
      return res.json({ success: true, clientDeleted: true });
    }
    res.json({ success: true, clientDeleted: false, credential });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /credentials/:clientId/services  (bulk)
───────────────────────────────────────────── */
exports.bulkDeleteServices = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { serviceIds = [] } = req.body;
    if (!serviceIds.length)
      return res.status(400).json({ error: "serviceIds is required" });

    const credential = await Credential.findOneAndUpdate(
      { _id: clientId, user: req.user._id },
      { $pull: { services: { _id: { $in: serviceIds } } } },
      { new: true },
    );
    if (!credential)
      return res.status(404).json({ error: "Client record not found" });

    if (credential.services.length === 0) {
      await Credential.findByIdAndDelete(clientId);
      return res.json({
        success: true,
        clientDeleted: true,
        deleted: serviceIds.length,
      });
    }
    res.json({
      success: true,
      clientDeleted: false,
      deleted: serviceIds.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   POST /credentials/:clientId/services/:serviceId/renewals
───────────────────────────────────────────── */
exports.addRenewal = async (req, res) => {
  try {
    const { clientId, serviceId } = req.params;
    const { date, duration, cost, notes } = req.body;

    if (!date || !duration)
      return res.status(400).json({ error: "date and duration are required" });

    const renewal = {
      date: new Date(date),
      duration: Number(duration),
      cost,
      notes,
    };

    const credential = await Credential.findOneAndUpdate(
      { _id: clientId, user: req.user._id, "services._id": serviceId },
      { $push: { "services.$.meta.renewal_history": renewal } },
      { new: true, runValidators: true },
    );
    if (!credential)
      return res.status(404).json({ error: "Service not found" });

    const service = credential.services.id(serviceId);
    res.status(201).json(service.meta.renewal_history.at(-1));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /credentials/:clientId/services/:serviceId/renewals/:renewalId
───────────────────────────────────────────── */
exports.deleteRenewal = async (req, res) => {
  try {
    const { clientId, serviceId, renewalId } = req.params;

    const credential = await Credential.findOneAndUpdate(
      { _id: clientId, user: req.user._id, "services._id": serviceId },
      { $pull: { "services.$.meta.renewal_history": { _id: renewalId } } },
      { new: true },
    );
    if (!credential)
      return res.status(404).json({ error: "Service not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /credentials/upcoming-renewals?days=30
───────────────────────────────────────────── */
exports.listUpcomingRenewals = async (req, res) => {
  try {
    const days = Number(req.query.days || 30);
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const docs = await Credential.find({
      user: req.user._id,
      $or: [
        { "services.expiry": { $gte: today, $lte: future } },
        { services: { $size: 0 }, expiry: { $gte: today, $lte: future } },
      ],
    });

    const renewals = [];
    docs.forEach((doc) => {
      const hasNewServices = doc.services && doc.services.length > 0;
      if (hasNewServices) {
        doc.services.forEach((svc) => {
          if (svc.expiry && svc.expiry >= today && svc.expiry <= future) {
            renewals.push({
              clientId: doc._id,
              client_name: doc.client_name,
              customer_id: doc.customer_id ?? null,
              serviceId: svc._id,
              type: svc.type,
              service_name: svc.service_name,
              provider: svc.provider,
              expiry: svc.expiry,
            });
          }
        });
      } else if (doc.expiry && doc.expiry >= today && doc.expiry <= future) {
        renewals.push({
          clientId: doc._id,
          client_name: doc.client_name,
          customer_id: doc.customer_id ?? null,
          serviceId: doc._id,
          type: doc.type,
          service_name: doc.service_name,
          provider: doc.provider,
          expiry: doc.expiry,
        });
      }
    });

    renewals.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    res.json(renewals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET /credentials/export
───────────────────────────────────────────── */
exports.exportCredentials = async (req, res) => {
  try {
    const docs = await Credential.find({ user: req.user._id });
    const rows = [];

    docs.forEach((doc) => {
      const hasNewServices = doc.services && doc.services.length > 0;
      if (hasNewServices) {
        doc.services.forEach((svc) => {
          rows.push({
            client_name: doc.client_name,
            customer_id: doc.customer_id ?? "",
            service_name: svc.service_name,
            type: svc.type,
            provider: svc.provider,
            portal_url: svc.portal_url,
            login: svc.login,
            password: svc.password,
            expiry: svc.expiry,
            notes: svc.notes,
            ip_address: svc.meta?.ip_address ?? "",
            panel_url: svc.meta?.panel?.url ?? "",
          });
        });
      } else {
        rows.push({
          client_name: doc.client_name,
          customer_id: doc.customer_id ?? "",
          service_name: doc.service_name,
          type: doc.type,
          provider: doc.provider,
          portal_url: doc.portal_url,
          login: doc.login,
          password: doc.password,
          expiry: doc.expiry,
          notes: doc.notes,
          ip_address: "",
          panel_url: "",
        });
      }
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ─────────────────────────────────────────────
   POST /credentials/migrate-legacy
───────────────────────────────────────────── */
exports.migrateLegacy = async (req, res) => {
  try {
    const docs = await Credential.find({ user: req.user._id });
    let migrated = 0;

    for (const doc of docs) {
      if (doc.services && doc.services.length > 0) continue;
      if (!doc.service_name && !doc.type) continue;

      const svc = {
        type: (doc.type || "domain").toLowerCase(),
        service_name: doc.service_name ?? "",
        provider: doc.provider ?? "",
        portal_url: doc.portal_url ?? "",
        login: doc.login ?? "admin",
        password: doc.password ?? "",
        expiry: doc.expiry ?? null,
        notes: doc.notes ?? "",
      };

      await Credential.findByIdAndUpdate(doc._id, {
        $push: { services: svc },
      });
      migrated++;
    }

    res.json({
      success: true,
      migrated,
      message: `${migrated} document(s) migrated.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
