// frontend/src/pages/Clients/ClientForm.jsx
import { useState } from "react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient, updateClient } from "@/lib/clients";
import { toast } from "sonner";
import {
  User, Building2, Phone, Mail, MapPin, Hash,
  Tag, MessageSquare, Calendar, RefreshCw, X, Plus,
} from "lucide-react";

/* ── category config ─────────────────────── */
const CATEGORIES = [
  { value: "premium",  label: "Premium",  cls: "bg-amber-50 text-amber-700 border-amber-200"  },
  { value: "regular",  label: "Regular",  cls: "bg-sky-50 text-sky-700 border-sky-200"              },
  { value: "lead",     label: "Lead",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "inactive", label: "Inactive", cls: "bg-gray-50 text-gray-600 border-gray-200"           },
  { value: "prospect", label: "Prospect", cls: "bg-violet-50 text-violet-700 border-violet-200" },
];

const EMPTY = {
  clientName: "", companyName: "", clientDesignation: "",
  companyAddress: "", city: "", phone: "", email: "",
  gstin: "", category: "regular", tags: [],
  notes: "", followUpDate: "", followUpNotes: "",
};

export default function ClientForm({ initialData, onSuccess, onCancel }) {
  const isEdit = !!initialData?._id;

  const [form, setForm]     = useState(() => ({
    ...EMPTY,
    ...(initialData ?? {}),
    tags:         initialData?.tags         ?? [],
    followUpDate: initialData?.followUpDate
      ? new Date(initialData.followUpDate).toISOString().slice(0, 10)
      : "",
  }));
  const [newTag,   setNewTag]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setNewTag("");
  };

  const removeTag = (t) => set("tags", form.tags.filter((x) => x !== t));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim())  e.clientName  = "Required";
    if (!form.companyName.trim()) e.companyName = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateClient(initialData._id, form);
        toast.success("Client updated");
      } else {
        await createClient(form);
        toast.success("Client created");
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const Err = ({ f }) =>
    errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;

  const Field = ({ id, label, icon: Icon, required, children }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}{required && <span className="text-red-400">*</span>}
      </Label>
      {children}
      <Err f={id} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Basic info ── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Client</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="clientName" label="Client Name" icon={User} required>
            <Input id="clientName" value={form.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              placeholder="John Doe"
              className={`h-8 text-sm ${errors.clientName ? "border-red-400" : "border-gray-200"}`} />
          </Field>
          <Field id="companyName" label="Company" icon={Building2} required>
            <Input id="companyName" value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Acme Inc."
              className={`h-8 text-sm ${errors.companyName ? "border-red-400" : "border-gray-200"}`} />
          </Field>
          <Field id="clientDesignation" label="Designation" icon={User}>
            <Input id="clientDesignation" value={form.clientDesignation}
              onChange={(e) => set("clientDesignation", e.target.value)}
              placeholder="CEO, Manager..."
              className="h-8 text-sm border-gray-200" />
          </Field>
          <Field id="city" label="City" icon={MapPin}>
            <Input id="city" value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Mumbai"
              className="h-8 text-sm border-gray-200" />
          </Field>
          <Field id="companyAddress" label="Address" icon={MapPin}>
            <Input id="companyAddress" value={form.companyAddress}
              onChange={(e) => set("companyAddress", e.target.value)}
              placeholder="123 Business Park..."
              className="h-8 text-sm border-gray-200" />
          </Field>
          <Field id="gstin" label="GSTIN" icon={Hash}>
            <Input id="gstin" value={form.gstin}
              onChange={(e) => set("gstin", e.target.value)}
              placeholder="22AAAAA0000A1Z5"
              className="h-8 text-sm border-gray-200" />
          </Field>
        </div>
      </section>

      <Separator className="bg-gray-100" />

      {/* ── Contact ── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="email" label="Email" icon={Mail}>
            <Input id="email" type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="john@acme.com"
              className="h-8 text-sm border-gray-200" />
          </Field>
          <Field id="phone" label="Phone" icon={Phone}>
            <Input id="phone" value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="h-8 text-sm border-gray-200" />
          </Field>
        </div>
      </section>

      <Separator className="bg-gray-100" />

      {/* ── Category ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.value} type="button" onClick={() => set("category", c.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                ${form.category === c.value
                  ? c.cls
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <Separator className="bg-gray-100" />

      {/* ── Tags ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />Tags
        </p>
        <div className="flex gap-2">
          <Input value={newTag} onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Add a tag and press Enter"
            className="h-8 text-sm border-gray-200 flex-1" />
          <Button type="button" size="sm" onClick={addTag}
            className="h-8 text-xs px-3 bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-gray-100" />

      {/* ── Notes ── */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />Notes
        </p>
        <textarea rows={3} value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Client requirements, preferences, background..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
      </section>

      <Separator className="bg-gray-100" />

      {/* ── Follow-up ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />Follow-up
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="followUpDate" label="Follow-up Date">
            <Input id="followUpDate" type="date" value={form.followUpDate}
              onChange={(e) => set("followUpDate", e.target.value)}
              className="h-8 text-sm border-gray-200" />
          </Field>
          <Field id="followUpNotes" label="Follow-up Notes">
            <Input id="followUpNotes" value={form.followUpNotes}
              onChange={(e) => set("followUpNotes", e.target.value)}
              placeholder="What to discuss..."
              className="h-8 text-sm border-gray-200" />
          </Field>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}
          className="h-8 text-xs border-gray-200">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={saving}
          className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
          {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}