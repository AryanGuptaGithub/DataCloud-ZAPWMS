// src/pages/Expense/ExpenseForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch }    from "@/components/ui/switch";
import { createExpense, updateExpense } from "@/lib/expenses";
import {
  ArrowLeft, FileText, DollarSign, Calendar, User,
  Tag, CreditCard, Repeat, RefreshCw,
  Utensils, Car, Home, ShoppingCart, Smartphone,
  Briefcase, Wrench, Megaphone, Receipt,
} from "lucide-react";

/* ── config ─────────────────────────────── */
const CATEGORIES = [
  { value: "food",          label: "Food",          icon: Utensils    },
  { value: "travel",        label: "Travel",        icon: Car         },
  { value: "utilities",     label: "Utilities",     icon: Home        },
  { value: "shopping",      label: "Shopping",      icon: ShoppingCart },
  { value: "entertainment", label: "Entertainment", icon: Smartphone  },
  { value: "office",        label: "Office",        icon: Briefcase   },
  { value: "rent",          label: "Rent",          icon: Home        },
  { value: "salary",        label: "Salary",        icon: DollarSign  },
  { value: "marketing",     label: "Marketing",     icon: Megaphone   },
  { value: "maintenance",   label: "Maintenance",   icon: Wrench      },
  { value: "software",      label: "Software",      icon: Smartphone  },
  { value: "other",         label: "Other",         icon: Receipt     },
];

const PAYMENT_METHODS = [
  { value: "cash",   label: "Cash"          },
  { value: "card",   label: "Card"          },
  { value: "bank",   label: "Bank Transfer" },
  { value: "online", label: "Online"        },
  { value: "check",  label: "Check"         },
];

const EMPTY = {
  title: "", amount: "", vendor: "",
  date: new Date().toISOString().slice(0, 10),
  category: "other", paymentMethod: "cash",
  notes: "", isRecurring: false,
};

/* ════════════════════════════════════════════
   FORM COMPONENT
════════════════════════════════════════════ */
export default function ExpenseForm({ initialData, id }) {
  const navigate  = useNavigate();
  const isEdit    = !!id;
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        title:         initialData.title         ?? "",
        amount:        initialData.amount        ?? "",
        vendor:        initialData.vendor        ?? "",
        date:          initialData.date          ?? new Date().toISOString().slice(0, 10),
        category:      initialData.category      ?? "other",
        paymentMethod: initialData.paymentMethod ?? "cash",
        notes:         initialData.notes         ?? "",
        isRecurring:   initialData.isRecurring   ?? false,
      });
    }
  }, [initialData]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())               e.title  = "Title is required";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.date)                       e.date   = "Date is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateExpense(id, form);
        toast.success("Expense updated");
      } else {
        await createExpense(form);
        toast.success("Expense added");
      }
      navigate("/dashboard/expenses");
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const Err = ({ f }) => errors[f]
    ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p>
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <button onClick={() => navigate("/dashboard/expenses")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Expenses
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Expense" : "Add Expense"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? "Update expense record" : "Record a new expense transaction"}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />Title *
              </Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="Office Rent, Team Lunch, Software Subscription..."
                className={`h-8 text-sm ${errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`} />
              <Err f="title" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />Amount (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                  <Input type="number" min="0" step="0.01"
                    value={form.amount} onChange={(e) => set("amount", e.target.value)}
                    placeholder="0.00"
                    className={`h-8 text-sm pl-7 ${errors.amount ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`} />
                </div>
                <Err f="amount" />
              </div>
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Date *
                </Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className={`h-8 text-sm ${errors.date ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`} />
                <Err f="date" />
              </div>
              {/* Vendor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />Vendor / Supplier
                </Label>
                <Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)}
                  placeholder="Vendor name or company"
                  className="h-8 text-sm border-gray-200 dark:border-gray-700" />
              </div>
              {/* Recurring */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />Recurring
                </Label>
                <div className="flex items-center gap-3 h-8">
                  <Switch
                    checked={form.isRecurring}
                    onCheckedChange={(v) => set("isRecurring", v)}
                  />
                  <span className="text-xs text-gray-500">
                    {form.isRecurring ? "Recurring expense" : "One-time expense"}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100 dark:bg-gray-800" />

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />Category
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => set("category", value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${form.category === value
                        ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"}`}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />Payment Method
              </Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => set("paymentMethod", value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${form.paymentMethod === value
                        ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-100 dark:bg-gray-800" />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</Label>
              <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Additional notes..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/dashboard/expenses")}
                className="h-8 text-xs border-gray-200 dark:border-gray-700" disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}
                className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
                {isEdit ? "Save Changes" : "Add Expense"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}