// src/pages/Income/EditIncome.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getIncomeById } from "@/lib/incomes";
import IncomeForm from "./IncomeForm";

export default function EditIncome() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const income = await getIncomeById(id);
        setData(income);
      } catch {
        toast.error("Income not found");
        navigate("/dashboard/income");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <IncomeForm initialData={data} id={id} />;
}