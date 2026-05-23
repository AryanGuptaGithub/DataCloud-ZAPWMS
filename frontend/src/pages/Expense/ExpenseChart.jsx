// src/pages/Expense/ExpenseChart.jsx
import TrendChart from "../components/TrendChart";

export default function ExpenseChart({ expenses }) {
  return <TrendChart records={expenses} color="#EF4444" label="Expenses" />;
}