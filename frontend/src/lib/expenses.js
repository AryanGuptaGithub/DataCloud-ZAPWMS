// frontend/src/lib/expenses.js
import api from "./axios";

// UI -> DB
function toDb(row) {
  return {
    title: row.title ?? "",
    amount: Number(row.amount ?? 0),
    vendor: row.vendor ?? "",
    date: row.date ? new Date(row.date) : new Date(),
    category: row.category ?? "other",
    paymentMethod: row.paymentMethod ?? "cash",
    notes: row.notes ?? "",
    isRecurring: row.isRecurring ?? false,
    receiptUrl: row.receiptUrl ?? "",
  };
}

// DB -> UI
function fromDb(row) {
  return {
    id: row._id,
    title: row.title,
    amount: row.amount,
    vendor: row.vendor || "",
    date: row.date
      ? new Date(row.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    category: row.category || "other",
    paymentMethod: row.paymentMethod || "cash",
    notes: row.notes || "",
    isRecurring: row.isRecurring || false,
    receiptUrl: row.receiptUrl || "",
    created_at: row.created_at,
  };
}

/** Get all expenses */
export async function listExpenses() {
  try {
    const { data } = await api.get("/expenses");
    return data.map(fromDb);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
}

/** Create expense */
export async function createExpense(payload) {
  const { data } = await api.post("/expenses", toDb(payload));
  return fromDb(data);
}

/** Update expense */
export async function updateExpense(id, payload) {
  const { data } = await api.put(`/expenses/${id}`, toDb(payload));
  return fromDb(data);
}

/** Delete expense */
export async function deleteExpense(id) {
  await api.delete(`/expenses/${id}`);
  return true;
}

/** Get expense by ID */
export async function getExpenseById(id) {
  try {
    const { data } = await api.get(`/expenses/${id}`);
    return fromDb(data);
  } catch (error) {
    console.error("Error fetching expense:", error);
    throw error;
  }
}

/** Bulk import expenses */
export async function bulkImportExpenses(expenses) {
  const { data } = await api.post("/expenses/bulk-import", expenses.map(toDb));
  return data.expenses.map(fromDb);
}

/** Export expenses to CSV */
export async function exportExpensesToCSV() {
  try {
    const expenses = await listExpenses();
    console.log("Exporting", expenses.length, "expense records");

    // Define all possible columns
    const columns = [
      { key: "date", label: "Date" },
      { key: "title", label: "Title" },
      { key: "amount", label: "Amount (₹)" },
      { key: "vendor", label: "Vendor" },
      { key: "category", label: "Category" },
      { key: "paymentMethod", label: "Payment Method" },
      { key: "isRecurring", label: "Recurring" },
      { key: "notes", label: "Notes" },
    ];

    // Create CSV headers
    const headers = columns.map((col) => col.label);

    // Create CSV rows
    const rows = expenses.map((expense) => {
      return columns.map((col) => {
        let value = expense[col.key] || "";

        // Format boolean values
        if (col.key === "isRecurring") {
          value = value ? "Yes" : "No";
        }

        // Escape CSV special characters
        const str = String(value);
        if (
          str.includes(",") ||
          str.includes('"') ||
          str.includes("\n") ||
          str.includes("\r")
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    console.log(
      "Generated CSV (first 500 chars):",
      csvContent.substring(0, 500)
    );

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return csvContent;
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}
