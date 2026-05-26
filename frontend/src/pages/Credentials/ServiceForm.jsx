// src/pages/Credentials/ServiceForm.jsx
import { useState, useEffect } from "react";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Globe, Server, Users, ChevronDown, ChevronUp,
  Plus, Trash2, RefreshCw, Eye, EyeOff, Sparkles,
} from "lucide-react";

/* ── password helpers ─────────────────────── */
function genPwd() {
  const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from({ length: 16 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}
function pwdStrength(pwd) {
  if (!pwd) return { score: 0, label: "", bar: "" };
  let s = 0;
  if (pwd.length >= 8)            s++;
  if (pwd.length >= 12)           s++;
  if (/[A-Z]/.test(pwd))         s++;
  if (/[0-9]/.test(pwd))         s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  const map = [
    { label: "Very weak",   bar: "bg-red-500"     },
    { label: "Weak",        bar: "bg-orange-500"  },
    { label: "Fair",        bar: "bg-yellow-500"  },
    { label: "Good",        bar: "bg-blue-500"    },
    { label: "Strong",      bar: "bg-emerald-500" },
    { label: "Very strong", bar: "bg-emerald-600" },
  ];
  return { score: s, ...map[Math.min(s, map.length - 1)] };
}

/* ── empty defaults ───────────────────────── */
const EMPTY_META = {
  start_date: "",
  renewal_history: [],
  nameservers: [],
  ip_address: "",
  server_details: "",
  dns_details: { nameservers: [], A: [], CNAME: [], MX: [], TXT: [] },
  domains: [],
  panel: { url: "", username: "", password: "" },
};
const EMPTY_SVC = {
  type: "Domain", service_name: "", provider: "",
  portal_url: "", login: "", password: "", expiry: "", notes: "",
  meta: { ...EMPTY_META },
};

function mergeWithDefaults(initial) {
  if (!initial) return { ...EMPTY_SVC, meta: { ...EMPTY_META } };
  return {
    ...EMPTY_SVC,
    ...initial,
    meta: {
      ...EMPTY_META,
      ...(initial.meta ?? {}),
      dns_details: { ...EMPTY_META.dns_details, ...(initial.meta?.dns_details ?? {}) },
      panel:       { ...EMPTY_META.panel,       ...(initial.meta?.panel ?? {})       },
      domains:     initial.meta?.domains     ?? [],
      nameservers: initial.meta?.nameservers ?? [],
      renewal_history: initial.meta?.renewal_history ?? [],
    },
  };
}

/* ── detect if meta has any filled data ────── */
function metaHasData(meta, type) {
  if (!meta) return false;
  if (type?.toLowerCase() === "domain") {
    return (meta.nameservers?.length ?? 0) > 0;
  }
  return !!(
    meta.ip_address ||
    meta.server_details ||
    meta.panel?.url ||
    meta.panel?.username ||
    (meta.domains?.length ?? 0) > 0 ||
    Object.values(meta.dns_details ?? {}).some((a) => (a?.length ?? 0) > 0)
  );
}

/* ════════════════ sub-components ════════════ */

function Section({ title, badge, hint, open, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700 shrink-0">
              {badge}
            </span>
          )}
          {hint && !open && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">{hint}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!open && (
            <span className="text-xs text-sky-600 font-medium">Click to expand</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && <div className="px-4 py-4 space-y-4">{children}</div>}
    </div>
  );
}

function DynamicList({ label, values, onChange, placeholder = "Enter value" }) {
  const add    = () => onChange([...values, ""]);
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  const update = (i, v) => onChange(values.map((x, idx) => idx === i ? v : x));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</Label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
          <Plus className="w-3 h-3" />Add
        </button>
      </div>
      {values.length === 0 ? (
        <button type="button" onClick={add}
          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:text-sky-600 hover:border-sky-400 transition-colors">
          + Add {label}
        </button>
      ) : (
        <div className="space-y-1.5">
          {values.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={v} onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
                className="h-8 text-xs border-gray-200 flex-1" />
              <button type="button" onClick={() => remove(i)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DnsSection({ dns, onChange }) {
  const update = (key, vals) => onChange({ ...dns, [key]: vals });
  return (
    <div className="space-y-4">
      {["nameservers", "A", "CNAME", "MX", "TXT"].map((key) => (
        <DynamicList key={key}
          label={key === "nameservers" ? "Nameservers" : `${key} Records`}
          values={dns?.[key] ?? []}
          onChange={(v) => update(key, v)}
          placeholder={
            key === "nameservers" ? "ns1.example.com"
            : key === "A"     ? "192.168.1.1"
            : key === "CNAME" ? "alias.example.com"
            : key === "MX"    ? "10 mail.example.com"
            : "v=spf1 include:..."
          }
        />
      ))}
    </div>
  );
}

function DomainMappingList({ domains, onChange }) {
  const add = () => onChange([...domains, { domain: "", type: "main", records: { A: [], CNAME: [], MX: [], TXT: [] } }]);
  const remove = (i) => onChange(domains.filter((_, idx) => idx !== i));
  const updateField = (i, field, val) => onChange(domains.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  const updateRecord = (i, key, vals) => onChange(domains.map((d, idx) =>
    idx === i ? { ...d, records: { ...d.records, [key]: vals } } : d));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mapped Domains</Label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
          <Plus className="w-3 h-3" />Add Domain
        </button>
      </div>
      {domains.length === 0 ? (
        <button type="button" onClick={add}
          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:text-sky-600 hover:border-sky-400 transition-colors">
          + Add mapped domain or subdomain
        </button>
      ) : (
        domains.map((d, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Input value={d.domain} onChange={(e) => updateField(i, "domain", e.target.value)}
                placeholder="example.com" className="h-8 text-xs border-gray-200 flex-1" />
              <select value={d.type} onChange={(e) => updateField(i, "type", e.target.value)}
                className="h-8 text-xs border border-gray-200 rounded-lg px-2 bg-white text-gray-700 shrink-0">
                <option value="main">Main</option>
                <option value="subdomain">Subdomain</option>
              </select>
              <button type="button" onClick={() => remove(i)} className="p-1 text-gray-400 hover:text-red-500 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {["A", "CNAME", "MX", "TXT"].map((key) => (
                <DynamicList key={key} label={`${key} Records`}
                  values={d.records?.[key] ?? []}
                  onChange={(v) => updateRecord(i, key, v)}
                  placeholder={key === "A" ? "192.168.1.1" : key === "CNAME" ? "alias.domain.com" : "record..."} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ════════════════ MAIN FORM ════════════════ */
export default function ServiceForm({ initial, clientName, onSave, onCancel, saving }) {
  const [form,      setForm]      = useState(() => mergeWithDefaults(initial));
  const [showPwd,   setShowPwd]   = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [errs,      setErrs]      = useState({});

  // Auto-open advanced section if editing a service that already has meta data
  const [openSections, setOpenSections] = useState(() => ({
    renewal:  false,
    advanced: initial ? metaHasData(initial.meta, initial.type) : false,
  }));

  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  useEffect(() => {
    const merged = mergeWithDefaults(initial);
    setForm(merged);
    setErrs({});
    setOpenSections({
      renewal:  false,
      advanced: initial ? metaHasData(initial?.meta, initial?.type) : false,
    });
  }, [initial]);

  const set      = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrs((e) => ({ ...e, [k]: null })); };
  const setMeta  = (k, v) => setForm((f) => ({ ...f, meta: { ...f.meta, [k]: v } }));
  const setPanel = (k, v) => setForm((f) => ({ ...f, meta: { ...f.meta, panel: { ...f.meta.panel, [k]: v } } }));
  const setDns   = (dns)  => setForm((f) => ({ ...f, meta: { ...f.meta, dns_details: dns } }));

  const validate = () => {
    const e = {};
    if (!form.service_name?.trim()) e.service_name = "Required";
    if (!form.provider?.trim())     e.provider     = "Required";
    if (!form.expiry)               e.expiry       = "Required";
    if (form.portal_url && !/^https?:\/\//i.test(form.portal_url))
      e.portal_url = "Must start with https://";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave({ ...form, login: form.login?.trim() || "admin" });
  };

  const daysLeft = (() => {
    if (!form.expiry) return null;
    return Math.ceil((new Date(form.expiry) - new Date()) / (1000 * 60 * 60 * 24));
  })();

  const pwd        = pwdStrength(form.password);
  const Err        = ({ f }) => errs[f] ? <p className="text-xs text-red-500 mt-1">{errs[f]}</p> : null;
  const isDomain   = form.type?.toLowerCase() === "domain";

  const advancedCount = (() => {
    let c = 0;
    if (isDomain) {
      if ((form.meta?.nameservers ?? []).length) c++;
    } else {
      if (form.meta?.ip_address)  c++;
      if (form.meta?.server_details) c++;
      if (form.meta?.panel?.url) c++;
      const dns = Object.values(form.meta?.dns_details ?? {}).reduce((s, a) => s + (a?.length ?? 0), 0);
      if (dns) c++;
      if ((form.meta?.domains ?? []).length) c++;
    }
    return c || null;
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 ">

      {/* Client label */}
      {clientName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            Client: <span className="font-medium text-gray-900">{clientName}</span>
          </span>
        </div>
      )}

      {/* ── SECTION 1: Basic Info ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Basic Info</p>

        {/* Type toggle */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Domain", "Hosting"].map((t) => (
              <button key={t} type="button" onClick={() => set("type", t)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all
                  ${form.type === t
                    ? t === "Domain"
                      ? "bg-sky-50 border-sky-300 text-sky-700"
                      : "bg-violet-50 border-violet-300 text-violet-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {t === "Domain" ? <Globe className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {isDomain ? "Domain Name" : "Service Name"} *
            </Label>
            <Input value={form.service_name} onChange={(e) => set("service_name", e.target.value)}
              placeholder={isDomain ? "example.com" : "Shared Hosting / VPS"}
              className={`h-8 text-sm ${errs.service_name ? "border-red-400" : "border-gray-200"}`} />
            <Err f="service_name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Provider *</Label>
            <Input value={form.provider} onChange={(e) => set("provider", e.target.value)}
              placeholder={isDomain ? "GoDaddy, Namecheap..." : "AWS, HostGator..."}
              className={`h-8 text-sm ${errs.provider ? "border-red-400" : "border-gray-200"}`} />
            <Err f="provider" />
          </div>

         

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</Label>
            <Input type="date" value={form.meta?.start_date ?? ""}
              onChange={(e) => setMeta("start_date", e.target.value)}
              className="h-8 text-sm border-gray-200" />
          </div>

            

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date *</Label>
            <Input type="date" value={form.expiry} onChange={(e) => set("expiry", e.target.value)}
              className={`h-8 text-sm ${errs.expiry ? "border-red-400" : "border-gray-200"}`} />
            <Err f="expiry" />
            {form.expiry && daysLeft !== null && (
              <p className={`text-xs font-medium ${daysLeft < 0 ? "text-red-500" : daysLeft <= 30 ? "text-orange-500" : "text-emerald-600"}`}>
                {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} days`}
              </p>
            )}
          </div>

           <div className="space-y-1.5  sm:col-span-2">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal URL</Label>
            <Input value={form.portal_url} onChange={(e) => set("portal_url", e.target.value)}
              placeholder="https://account.provider.com"
              className={`h-8 text-sm ${errs.portal_url ? "border-red-400" : "border-gray-200"}`} />
            <Err f="portal_url" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</Label>
          <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Additional notes..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* ── SECTION 2: Credentials ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Credentials</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Login / Username</Label>
            <Input value={form.login} onChange={(e) => set("login", e.target.value)}
              placeholder="admin" className="h-8 text-sm border-gray-200" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password</Label>
              <button type="button" onClick={() => set("password", genPwd())}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                Generate
              </button>
            </div>
            <div className="relative">
              <Input type={showPwd ? "text" : "password"} value={form.password}
                onChange={(e) => set("password", e.target.value)} placeholder="••••••••"
                className="h-8 text-sm pr-8 border-gray-200" />
              <button type="button" onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {form.password && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-0.5">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < pwd.score ? pwd.bar : "bg-gray-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">{pwd.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-gray-100" />

      {/* ── SECTION 3: Renewal Info (collapsible, read-only) ── */}
      <Section
        title="Renewal History"
        badge={(form.meta?.renewal_history ?? []).length > 0 ? `${form.meta.renewal_history.length} record${form.meta.renewal_history.length !== 1 ? "s" : ""}` : null}
        hint="View past renewals"
        open={openSections.renewal}
        onToggle={() => toggleSection("renewal")}
      >
        <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
          Use the <strong>"Renewals"</strong> button on the service detail view to add or delete renewal records.
        </p>
        {(form.meta?.renewal_history ?? []).length > 0 ? (
          <div className="space-y-1.5">
            {[...(form.meta.renewal_history)].reverse().map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-xs px-3 py-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{r.date}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{r.duration}yr</span>
                {r.cost && <><span className="text-gray-400">·</span><span className="text-gray-600">₹{r.cost}</span></>}
                {r.notes && <span className="text-gray-400 truncate">{r.notes}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No renewals recorded yet</p>
        )}
      </Section>

      {/* ── SECTION 4: Advanced Settings (collapsible, conditional) ── */}
      <Section
        title={isDomain ? "Domain Advanced Settings" : "Hosting Advanced Settings"}
        badge={advancedCount ? `${advancedCount} filled` : null}
        hint={isDomain ? "Nameservers" : "IP, CyberPanel, DNS records, domain mapping"}
        open={openSections.advanced}
        onToggle={() => toggleSection("advanced")}
      >
        {/* Prominent helper text when first opening */}
        {!advancedCount && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 bg-sky-50 border border-sky-200 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-700">
              {isDomain
                ? "Add nameservers for this domain. These fields are optional — fill in what's relevant."
                : "Add VPS IP, CyberPanel credentials, DNS records, and domain mappings. All fields are optional."}
            </p>
          </div>
        )}

        {isDomain ? (
          /* ─── Domain: Nameservers ─── */
          <DynamicList
            label="Nameservers"
            values={form.meta?.nameservers ?? []}
            onChange={(v) => setMeta("nameservers", v)}
            placeholder="ns1.example.com"
          />
        ) : (
          /* ─── Hosting: all extended fields ─── */
          <div className="space-y-6">

            {/* Server Details */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300" />Server / VPS Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</Label>
                  <Input value={form.meta?.ip_address ?? ""} onChange={(e) => setMeta("ip_address", e.target.value)}
                    placeholder="192.168.1.1" className="h-8 text-sm border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Server Specs</Label>
                  <Input value={form.meta?.server_details ?? ""} onChange={(e) => setMeta("server_details", e.target.value)}
                    placeholder="2 vCPU, 4GB RAM, Ubuntu 22..." className="h-8 text-sm border-gray-200" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* CyberPanel */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300" />Control Panel (CyberPanel / cPanel)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Panel URL</Label>
                  <Input value={form.meta?.panel?.url ?? ""} onChange={(e) => setPanel("url", e.target.value)}
                    placeholder="https://server.com:8090" className="h-8 text-sm border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Panel Username</Label>
                  <Input value={form.meta?.panel?.username ?? ""} onChange={(e) => setPanel("username", e.target.value)}
                    placeholder="admin" className="h-8 text-sm border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Panel Password</Label>
                    <button type="button" onClick={() => setShowPanel((s) => !s)} className="text-gray-400 hover:text-gray-600">
                      {showPanel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Input type={showPanel ? "text" : "password"} value={form.meta?.panel?.password ?? ""}
                    onChange={(e) => setPanel("password", e.target.value)}
                    placeholder="••••••••" className="h-8 text-sm border-gray-200" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* DNS Records */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300" />DNS Records
              </p>
              <DnsSection dns={form.meta?.dns_details ?? EMPTY_META.dns_details} onChange={setDns} />
            </div>

            <Separator className="bg-gray-100" />

            {/* Domain Mapping */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300" />Domain & Subdomain Mapping
              </p>
              <DomainMappingList
                domains={form.meta?.domains ?? []}
                onChange={(v) => setMeta("domains", v)}
              />
            </div>
          </div>
        )}
      </Section>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}
          className="h-8 text-xs border-gray-200">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}
          className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
          {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
          {initial ? "Save Changes" : "Add Service"}
        </Button>
      </div>
    </form>
  );
}