// /src/routes/clientRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/clientController");
const protect = require("../middleware/auth");

// all client routes are protected
router.use(protect);

// Basic CRUD operations
router.get("/", controller.listClients);
router.post("/", controller.createClient);
router.get("/:id", controller.getClient); // ADD THIS LINE
router.put("/:id", controller.updateClient);
router.delete("/:id", controller.deleteClient);

// Enhanced features
router.get("/upcoming-followups", controller.listUpcomingFollowups);
router.post("/:id/communication", controller.addCommunicationLog);
router.post("/import", controller.importClients);
router.get("/export", controller.exportClients);

module.exports = router;
