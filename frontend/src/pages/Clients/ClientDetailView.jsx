// frontend/src/pages/Clients/ClientDetailView.jsx
import { useState } from "react";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { addCommunicationLog } from "@/lib/clients";
import { toast } from "sonner";
import {
  User, Building2, Phone, Mail, MapPin, Hash, Tag,
  MessageSquare, Calendar, Pencil, Download,
  PhoneCall, Video, Clock, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { format, isValid } from "date-fns";

/* ── helpers ─────────────────────────────── */
const CATEGORIES = {
  premium:  { label: "Premium",  cls: "bg-amber-50 text-amber-700 border-amber-200"    },
  regular:  { label: "Regular",  cls: "bg-sky-50 text-sky-700 border-sky-200"                },
  lead:     { label: "Lead",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactive", cls: "bg-gray-100 text-gray-600 border-gray-200"            },
  prospect: { label: "Prospect", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

const COM_ICONS = {
  email:   { icon: Mail,      cls: "text-sky-500"    },
  call:    { icon: PhoneCall, cls: "text-emerald-500" },
  meeting: { icon: Video,     cls: "text-violet-500" },
  message: { icon: MessageSquare, cls: "text-orange-500" },
};

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}

/* ── Communication Log Form ── */
function CommLogForm({ clientId, onAdded }) {
  const [type,    setType]    = useState("call");
  const [summary, setSummary] = useState("");
  const [notes,   setNotes]   = useState("");
  const [saving,  setSaving]  = useState(false);

  const TYPES = ["call", "email", "meeting", "message"];

  const submit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) { toast.error("Summary is required"); return; }
    setSaving(true);
    try {
      await addCommunicationLog(clientId, { type, summary, notes });
      toast.success("Communication logged");
      setSummary(""); setNotes("");
      onAdded?.();
    } catch {
      toast.error("Failed to log communication");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Log Communication</p>
      <div className="flex gap-2">
        {TYPES.map((t) => {
          const { icon: Icon, cls } = COM_ICONS[t];
          return (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${type === t ? `${cls} bg-white border-current` : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              <Icon className="w-3 h-3" />{t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          );
        })}
      </div>
      <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)}
        placeholder="Summary of what was discussed..."
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
      <textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Additional notes (optional)"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving}
          className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
          {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
          Log
        </Button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function ClientDetailView({ client, onEdit, onClose }) {
  const [tab,       setTab]       = useState("overview");
  const [commLogs,  setCommLogs]  = useState(client.communicationLogs ?? []);
  const [logsExp,   setLogsExp]   = useState(false);

  const cat = CATEGORIES[client.category] ?? CATEGORIES.regular;

  const handleExport = () => {
    const rows = [
      ["Client Name", "Company", "Email", "Phone", "City", "GSTIN", "Category", "Notes"],
      [client.clientName, client.companyName, client.email, client.phone,
       client.city, client.gstin, client.category, client.notes],
    ];
    const csv  = rows.map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${client.clientName}.csv`;
    a.click();
  };

  const TABS = ["overview", "communication"];

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-gray-900">{client.clientName}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cat.cls}`}>
              {cat.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{client.companyName}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <button onClick={handleExport}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          {onEdit && (
            <Button size="sm" onClick={onEdit}
              className="h-7 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
              <Pencil className="w-3 h-3" />Edit
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize
              ${tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={Mail}      label="Email"      value={client.email}            />
            <InfoRow icon={Phone}     label="Phone"      value={client.phone}            />
            <InfoRow icon={MapPin}    label="City"       value={client.city}             />
            <InfoRow icon={Building2} label="Address"    value={client.companyAddress}   />
            <InfoRow icon={Hash}      label="GSTIN"      value={client.gstin}            />
            <InfoRow icon={User}      label="Designation" value={client.clientDesignation} />
          </div>

          {/* Tags */}
          {client.tags?.length > 0 && (
            <>
              <Separator className="bg-gray-100" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {client.notes && (
            <>
              <Separator className="bg-gray-100" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {client.notes}
                </p>
              </div>
            </>
          )}

          {/* Follow-up */}
          {client.followUpDate && (
            <>
              <Separator className="bg-gray-100" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Follow-up
                </p>
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{fmtDate(client.followUpDate)}</p>
                    {client.followUpNotes && (
                      <p className="text-xs text-amber-700 mt-0.5">{client.followUpNotes}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Meta */}
          <Separator className="bg-gray-100" />
          <p className="text-xs text-gray-400">Added {fmtDate(client.created_at ?? client.createdAt)}</p>
        </div>
      )}

      {/* ── Communication ── */}
      {tab === "communication" && (
        <div className="space-y-4">
          <CommLogForm clientId={client._id} onAdded={() => {
            // optimistic: tell parent to refresh if needed
          }} />

          {commLogs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">History ({commLogs.length})</p>
                {commLogs.length > 3 && (
                  <button onClick={() => setLogsExp((e) => !e)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    {logsExp ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />+{commLogs.length - 3} more</>}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(logsExp ? commLogs : commLogs.slice(0, 3))
                  .slice()
                  .reverse()
                  .map((log, i) => {
                    const { icon: Icon, cls } = COM_ICONS[log.type] ?? COM_ICONS.call;
                    return (
                      <div key={i} className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-gray-50 ${cls}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-700 capitalize">{log.type}</p>
                            <p className="text-xs text-gray-400 shrink-0">{fmtDate(log.date)}</p>
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5">{log.summary}</p>
                          {log.notes && <p className="text-xs text-gray-400 mt-1">{log.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {commLogs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No communication logged yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}