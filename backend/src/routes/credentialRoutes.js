// backend/src/routes/credentialRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/credentialController");
const protect = require("../middleware/auth");

/* ── Special routes first (before :clientId param) ── */
router.get("/upcoming-renewals", protect, ctrl.listUpcomingRenewals);
router.get("/export", protect, ctrl.exportCredentials);
router.post("/migrate-legacy", protect, ctrl.migrateLegacy);

/* ── Client-level ─────────────────────────────────── */
router.get("/", protect, ctrl.listCredentials);
router.post("/", protect, ctrl.createCredential);
router.get("/:clientId", protect, ctrl.getCredential);
router.patch("/:clientId", protect, ctrl.updateCredential);
router.delete("/:clientId", protect, ctrl.deleteCredential);

/* ── Service-level ────────────────────────────────── */
router.post("/:clientId/services", protect, ctrl.addServices);
router.put("/:clientId/services/:serviceId", protect, ctrl.updateService);
router.delete("/:clientId/services/:serviceId", protect, ctrl.deleteService);
router.delete("/:clientId/services", protect, ctrl.bulkDeleteServices);

/* ── Renewal history ──────────────────────────────── */
router.post(
  "/:clientId/services/:serviceId/renewals",
  protect,
  ctrl.addRenewal,
);
router.delete(
  "/:clientId/services/:serviceId/renewals/:renewalId",
  protect,
  ctrl.deleteRenewal,
);

module.exports = router;
