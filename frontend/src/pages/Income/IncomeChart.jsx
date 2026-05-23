// src/pages/Income/IncomeChart.jsx
import TrendChart from "../components/TrendChart";

export default function IncomeChart({ incomes }) {
  return <TrendChart records={incomes} color="#10B981" label="Income" />;
}