// backend/routes/incomeRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/incomeController");
const protect = require("../middleware/auth");

// Protect all income routes
router.use(protect);

router.get("/", controller.listIncomes);
router.post("/", controller.createIncome);
router.put("/:id", controller.updateIncome);
router.delete("/:id", controller.deleteIncome);
router.post("/bulk-import", controller.bulkImport); // Add bulk import route

module.exports = router;