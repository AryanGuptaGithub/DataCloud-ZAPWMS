// src/pages/Credentials/AddCredentialPage.jsx
/**
 * AddCredentialPage
 * Full-page route at /dashboard/credentials/add
 *
 * Step 1 — Pick from Customers page (GET /clients) with search.
 *           "+ Add as new" fallback for clients not yet in Customers.
 * Step 2 — Fill ServiceForm
 * Step 3 — Saved! Offer to add another service or go done.
 */
import React, { useEffect, useState, useRef } from "react";
import { useNavigate }  from "react-router-dom";
import { Button }       from "@/components/ui/button";
import { Input }        from "@/components/ui/input";
import { Label }        from "@/components/ui/label";
import { toast }        from "sonner";
import {
  ArrowLeft, Search, Users, Plus, RefreshCw,
  Globe, Server, CheckCircle2, ChevronRight,
  Building2, X, UserPlus, ExternalLink,
} from "lucide-react";
import api              from "@/lib/axios";
import {
  createCredential, addService,
} from "@/lib/credentials";
import ServiceForm from "./ServiceForm";

/* ── helpers ─────────────────────────────── */
function StepDot({ n, active, done }) {
  if (done) return (
    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
    </div>
  );
  return (
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
      ${active
        ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900"
        : "border-gray-300 dark:border-gray-600 text-gray-400"}`}>
      {n}
    </div>
  );
}

/* ── CustomerPicker ──────────────────────── */
function CustomerPicker({ onSelect, onAddNew }) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/clients");
        setCustomers(data);
      } catch {
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    })();
  }, []);

  const displayName = (c) => c.clientName ?? c.name ?? "—";
  const subLine     = (c) => [c.companyName, c.email].filter(Boolean).join(" · ");

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      displayName(c).toLowerCase().includes(q) ||
      (c.companyName ?? "").toLowerCase().includes(q) ||
      (c.email       ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company or email…"
          className="pl-9 h-9 text-sm border-gray-200 dark:border-gray-700"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading clients…</span>
          </div>
        ) : filtered.length === 0 && !search ? (
          <div className="py-8 text-center px-4">
            <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">No clients yet</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add clients on the <strong>Customers</strong> page first,
              or use the free-text option below.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">No match for "<strong>{search}</strong>"</p>
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors text-left group">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {displayName(c)}
                </p>
                {subLine(c) && (
                  <p className="text-xs text-gray-400 truncate">{subLine(c)}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-sky-400 shrink-0 transition-colors" />
            </button>
          ))
        )}

        {/* Always-visible free-text fallback */}
        <button
          type="button"
          onClick={onAddNew}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group bg-gray-50/80 dark:bg-gray-800/40">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              + Add as new client
            </p>
            <p className="text-xs text-gray-400">Not in your Customers list yet</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── FreeTextClient ──────────────────────── */
function FreeTextClient({ value, onChange, error, onBack }) {
  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />Back to client list
      </button>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Client Name *
        </Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Acme Corporation"
          autoFocus
          className={`h-9 text-sm ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-gray-400">
          This client won't be linked to your Customers page — you can add them there later.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export default function AddCredentialPage() {
  const navigate = useNavigate();

  /* client selection */
  const [clientMode,     setClientMode]     = useState("pick"); // "pick" | "freetext"
  const [pickedCustomer, setPickedCustomer] = useState(null);   // Customer doc from /clients
  const [freeName,       setFreeName]       = useState("");
  const [freeNameErr,    setFreeNameErr]    = useState("");

  const resolvedName       = pickedCustomer
    ? (pickedCustomer.clientName ?? pickedCustomer.name ?? "")
    : freeName.trim();
  const resolvedCustomerId = pickedCustomer?._id ?? null;

  /* steps */
  const [step,          setStep]          = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [savedClientId, setSavedClientId] = useState(null);
  const [savedTypes,    setSavedTypes]    = useState([]);

  const missingType =
    savedTypes.includes("domain") && !savedTypes.includes("hosting") ? "Hosting"
    : !savedTypes.includes("domain") && savedTypes.includes("hosting") ? "Domain"
    : null;

  /* step 1 → 2 (free-text mode only; picker mode goes directly on click) */
  const goToService = () => {
    if (!freeName.trim()) { setFreeNameErr("Client name is required"); return; }
    setFreeNameErr("");
    setStep(2);
  };

  /* ServiceForm submit */
  const handleServiceSave = async (svc) => {
    setSaving(true);
    try {
      let newClientId = null;
      if (savedClientId) {
        await addService(savedClientId, svc);
        newClientId = savedClientId;
      } else {
        const rows = await createCredential({
          client_name: resolvedName,
          customer_id: resolvedCustomerId,
          service:     svc,
        });
        newClientId = Array.isArray(rows) ? rows[0]?.clientId : null;
      }
      if (newClientId) setSavedClientId(newClientId);
      setSavedTypes((p) => [...p, (svc.type || "domain").toLowerCase()]);
      toast.success("Service saved");
      setStep(3);
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDone       = () => navigate("/dashboard/credentials");
  const handleAddAnother = () => setStep(2);
  const handleAddNew     = () => {
    setPickedCustomer(null); setFreeName("");
    setSavedClientId(null);  setSavedTypes([]);
    setClientMode("pick");   setStep(1);
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 md:px-6 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={handleDone}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Add Credential</h1>
          </div>
          {step < 3 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <StepDot n={1} active={step === 1} done={step > 1} />
                <span className={`text-xs font-medium hidden sm:block ${step >= 1 ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>Client</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              <div className="flex items-center gap-1.5">
                <StepDot n={2} active={step === 2} done={step > 2} />
                <span className={`text-xs font-medium hidden sm:block ${step >= 2 ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>Service</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Select Client</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pick from your Customers list to hard-link this credential to a client profile.
              </p>
            </div>

            {clientMode === "pick" ? (
              <CustomerPicker
                onSelect={(customer) => { setPickedCustomer(customer); setStep(2); }}
                onAddNew={() => { setPickedCustomer(null); setClientMode("freetext"); }}
              />
            ) : (
              <>
                <FreeTextClient
                  value={freeName}
                  onChange={(v) => { setFreeName(v); setFreeNameErr(""); }}
                  error={freeNameErr}
                  onBack={() => setClientMode("pick")}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={goToService}
                    className="h-9 px-6 text-sm gap-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-3">
            {/* Context banner */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{resolvedName}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {pickedCustomer ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />Linked to Customers
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Free-text (not linked)</span>
                      )}
                      {savedTypes.length > 0 && (
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                          · {savedTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" + ")} saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {savedTypes.length === 0 && (
                  <button type="button" onClick={() => setStep(1)}
                    className="text-xs text-gray-400 hover:text-gray-600 shrink-0">
                    Change
                  </button>
                )}
              </div>
            </div>

            {/* Service form */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {savedTypes.length > 0 && missingType ? `Add ${missingType} Service` : "Service Details"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {savedTypes.length > 0 && missingType
                    ? `Complete the ${missingType.toLowerCase()} details for ${resolvedName}`
                    : "Fill in the domain or hosting details"}
                </p>
              </div>
              <ServiceForm
                initial={missingType ? { type: missingType } : null}
                clientName={resolvedName}
                onSave={handleServiceSave}
                onCancel={() => savedTypes.length > 0 ? setStep(3) : setStep(1)}
                saving={saving}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Success */}
            <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900 rounded-xl px-4 py-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Service saved!</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {savedTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" + ")}
                  </span>
                  {" "}added to{" "}
                  <strong className="text-gray-700 dark:text-gray-300">{resolvedName}</strong>
                </p>
                {pickedCustomer && (
                  <button type="button" onClick={() => navigate("/dashboard/customers")}
                    className="mt-1.5 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline">
                    <ExternalLink className="w-3 h-3" />View client profile in Customers
                  </button>
                )}
              </div>
            </div>

            {/* Add missing type */}
            {missingType && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add another service?</p>
                <button type="button" onClick={handleAddAnother}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all hover:shadow-sm text-left
                    ${missingType === "Domain"
                      ? "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 hover:border-sky-400"
                      : "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 hover:border-violet-400"}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                    ${missingType === "Domain" ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600" : "bg-violet-100 dark:bg-violet-900/50 text-violet-600"}`}>
                    {missingType === "Domain" ? <Globe className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${missingType === "Domain" ? "text-sky-700 dark:text-sky-300" : "text-violet-700 dark:text-violet-300"}`}>
                      + Add {missingType} Service
                    </p>
                    <p className="text-xs text-gray-500">
                      {missingType === "Domain" ? "Domain name, nameservers, expiry" : "Hosting plan, IP, panel, DNS records"}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {!missingType && (
              <button type="button" onClick={handleAddAnother}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors bg-white dark:bg-gray-900">
                <Plus className="w-3.5 h-3.5" />Add another service for {resolvedName}
              </button>
            )}

            <button type="button" onClick={handleAddNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors bg-white dark:bg-gray-900">
              <Plus className="w-3 h-3" />Add credential for a different client
            </button>

            <Button size="sm" onClick={handleDone}
              className="w-full h-10 text-sm font-semibold gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white rounded-xl">
              Done — Back to Credentials
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}