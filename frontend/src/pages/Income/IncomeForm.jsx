// src/pages/Income/IncomeForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createIncome, updateIncome } from "@/lib/incomes";
import {
  ArrowLeft, FileText, DollarSign, Calendar,
  User, Briefcase, Tag, CreditCard, CheckCircle,
  RefreshCw,
} from "lucide-react";

/* ── config ─────────────────────────────── */
const CATEGORIES = [
  { value: "sales",      label: "Sales"      },
  { value: "service",    label: "Service"    },
  { value: "consulting", label: "Consulting" },
  { value: "rental",     label: "Rental"     },
  { value: "interest",   label: "Interest"   },
  { value: "dividend",   label: "Dividend"   },
  { value: "commission", label: "Commission" },
  { value: "freelance",  label: "Freelance"  },
  { value: "other",      label: "Other"      },
];

const PAYMENT_METHODS = [
  { value: "cash",   label: "Cash"          },
  { value: "card",   label: "Card"          },
  { value: "bank",   label: "Bank Transfer" },
  { value: "online", label: "Online"        },
  { value: "check",  label: "Check"         },
];

const STATUSES = [
  { value: "received",  label: "Received",  cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "pending",   label: "Pending",   cls: "text-amber-700 bg-amber-50 border-amber-200"           },
  { value: "cancelled", label: "Cancelled", cls: "text-red-700 bg-red-50 border-red-200"                       },
];

const EMPTY = {
  title: "", amount: "", customer: "", source: "",
  date: new Date().toISOString().slice(0, 10),
  category: "sales", paymentMethod: "cash",
  status: "received", notes: "",
};

/* ════════════════════════════════════════════
   FORM COMPONENT
════════════════════════════════════════════ */
export default function IncomeForm({ initialData, id }) {
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
        customer:      initialData.customer      ?? "",
        source:        initialData.source        ?? "",
        date:          initialData.date          ?? new Date().toISOString().slice(0, 10),
        category:      initialData.category      ?? "sales",
        paymentMethod: initialData.paymentMethod ?? "cash",
        status:        initialData.status        ?? "received",
        notes:         initialData.notes         ?? "",
      });
    }
  }, [initialData]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())              e.title  = "Title is required";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.date)                      e.date   = "Date is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateIncome(id, form);
        toast.success("Income updated");
      } else {
        await createIncome(form);
        toast.success("Income added");
      }
      navigate("/dashboard/income");
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const Err = ({ f }) => errors[f]
    ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p>
    : null;

  const ToggleGroup = ({ options, value, onChange, activeClass }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
            ${value === o.value
              ? activeClass ?? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <button onClick={() => navigate("/dashboard/income")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Income
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit Income" : "Add Income"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? "Update income record" : "Record a new income transaction"}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />Title *
              </Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="Project Payment, Consulting Fee..."
                className={`h-8 text-sm ${errors.title ? "border-red-400" : "border-gray-200"}`} />
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
                    className={`h-8 text-sm pl-7 ${errors.amount ? "border-red-400" : "border-gray-200"}`} />
                </div>
                <Err f="amount" />
              </div>
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Date *
                </Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className={`h-8 text-sm ${errors.date ? "border-red-400" : "border-gray-200"}`} />
                <Err f="date" />
              </div>
              {/* Customer */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />Customer / Client
                </Label>
                <Input value={form.customer} onChange={(e) => set("customer", e.target.value)}
                  placeholder="Client name or company"
                  className="h-8 text-sm border-gray-200" />
              </div>
              {/* Source */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />Source
                </Label>
                <Input value={form.source} onChange={(e) => set("source", e.target.value)}
                  placeholder="Income source"
                  className="h-8 text-sm border-gray-200" />
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />Category
              </Label>
              <ToggleGroup options={CATEGORIES} value={form.category} onChange={(v) => set("category", v)} />
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />Payment Method
              </Label>
              <ToggleGroup options={PAYMENT_METHODS} value={form.paymentMethod} onChange={(v) => set("paymentMethod", v)} />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s.value} type="button" onClick={() => set("status", s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${form.status === s.value ? s.cls : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</Label>
              <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Additional notes..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/dashboard/income")}
                className="h-8 text-xs border-gray-200" disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
                {isEdit ? "Save Changes" : "Add Income"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}