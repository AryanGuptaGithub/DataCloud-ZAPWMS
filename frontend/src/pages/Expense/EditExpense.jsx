// src/pages/Expense/EditExpense.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getExpenseById } from "@/lib/expenses";
import ExpenseForm from "./ExpenseForm";

export default function EditExpense() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const expense = await getExpenseById(id);
        setData(expense);
      } catch {
        toast.error("Expense not found");
        navigate("/dashboard/expenses");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <ExpenseForm initialData={data} id={id} />;
}