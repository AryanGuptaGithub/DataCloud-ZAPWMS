// frontend/src/lib/incomes.js
import api from "./axios";

// DB -> UI (Fix this function to include all fields)
function fromDb(row) {
  return {
    id: row._id,
    title: row.title,
    amount: row.amount,
    customer: row.customer || "",
    source: row.source || "",
    date: row.date
      ? new Date(row.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    category: row.category || "other",
    paymentMethod: row.paymentMethod || "cash",
    notes: row.notes || "",
    status: row.status || "received",
    created_at: row.created_at,
  };
}

// UI -> DB
function toDb(row) {
  return {
    title: row.title ?? "",
    amount: Number(row.amount ?? 0),
    customer: row.customer ?? "",
    source: row.source ?? "",
    date: row.date ? new Date(row.date) : new Date(),
    category: row.category ?? "other",
    paymentMethod: row.paymentMethod ?? "cash",
    notes: row.notes ?? "",
    status: row.status ?? "received",
  };
}

/** Get all incomes */
export async function listIncomes() {
  try {
    const { data } = await api.get("/incomes");
    // console.log("Raw income data from API:", data);
    return data.map(fromDb);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    throw error;
  }
}

/** Export incomes to CSV with all fields */
export async function exportIncomesToCSV() {
  try {
    const incomes = await listIncomes();

    // Create CSV with only available fields
    let csv = "Date,Title,Amount (₹),Notes\n";

    incomes.forEach((income) => {
      const row = [
        income.date || "",
        income.title || "",
        income.amount || 0,
        income.notes || "",
      ];

      // Escape and quote if needed
      const escapedRow = row.map((cell) => {
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      csv += escapedRow.join(",") + "\n";
    });

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incomes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return csv;
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

/** Create income */
export async function createIncome(payload) {
  const { data } = await api.post("/incomes", toDb(payload));
  return fromDb(data);
}

/** Update income */
export async function updateIncome(id, payload) {
  const { data } = await api.put(`/incomes/${id}`, toDb(payload));
  return fromDb(data);
}

/** Delete income */
export async function deleteIncome(id) {
  await api.delete(`/incomes/${id}`);
  return true;
}

// Add this to your incomes.js file
export async function getIncomeById(id) {
  try {
    const { data } = await api.get(`/incomes/${id}`);
    return fromDb(data);
  } catch (error) {
    console.error("Error fetching income:", error);
    throw error;
  }
}
