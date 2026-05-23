// backend/routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/expenseController");
const protect = require("../middleware/auth");

// Protect all expense routes
router.use(protect);

router.get("/", controller.listExpenses);
router.post("/", controller.createExpense);
router.get("/:id", controller.getExpense);
router.put("/:id", controller.updateExpense);
router.delete("/:id", controller.deleteExpense);
router.post("/bulk-import", controller.bulkImport); // Add bulk import route

module.exports = router;