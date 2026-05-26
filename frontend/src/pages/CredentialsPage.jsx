// src/pages/CredentialsPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  listCredentials, createCredential, addService,
  updateService, deleteService, bulkDeleteServices,
  addRenewal, deleteRenewal,
} from "@/lib/credentials";
import { useLoading } from "@/components/LoadingProvider";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search, Globe, Server, Copy, Plus, Pencil, Trash2,
  Eye, EyeOff, Download, RefreshCw, ChevronDown, ChevronUp,
  Clock, ExternalLink, MoreVertical, ShieldCheck, Users,
  AlertCircle, X, CheckSquare, Square, Bell,
  Layers, Key, RotateCcw, LayoutGrid, List, Calendar,
  Check,
} from "lucide-react";
import { differenceInDays, format, isValid } from "date-fns";
import ServiceForm      from "./Credentials/ServiceForm";
import ClientDetailPage from "./Credentials/ClientDetailPage";

/* ── helpers ─────────────────────────────── */
const URGENCY_MAP = {
  expired:  { label: "Expired",  color: "text-red-600",    bg: "bg-red-50",       border: "border-red-200",    dot: "bg-red-500"    },
  critical: { label: "Critical", color: "text-orange-600", bg: "bg-orange-50",    border: "border-orange-200", dot: "bg-orange-500" },
  warning:  { label: "Warning",  color: "text-amber-700",  bg: "bg-amber-50",     border: "border-amber-200",  dot: "bg-amber-400"  },
  upcoming: { label: "Upcoming", color: "text-blue-600",   bg: "bg-blue-50",      border: "border-blue-200",   dot: "bg-blue-500"   },
  active:   { label: "Active",   color: "text-emerald-700",bg: "bg-emerald-50",   border: "border-emerald-200",dot: "bg-emerald-500" },
  none:     { label: "No date",  color: "text-gray-400",   bg: "bg-gray-50",      border: "border-gray-200",   dot: "bg-gray-300"   },
};

function getUrgency(expiryStr) {
  if (!expiryStr) return { ...URGENCY_MAP.none, days: null };
  const d = new Date(expiryStr);
  if (!isValid(d)) return { ...URGENCY_MAP.none, days: null };
  const days = differenceInDays(d, new Date());
  if (days < 0)   return { ...URGENCY_MAP.expired,  days };
  if (days <= 7)  return { ...URGENCY_MAP.critical, days };
  if (days <= 30) return { ...URGENCY_MAP.warning,  days };
  if (days <= 90) return { ...URGENCY_MAP.upcoming, days };
  return { ...URGENCY_MAP.active, days };
}

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
};

async function copyText(val, label = "Copied") {
  if (!val) { toast.error("Nothing to copy"); return; }
  try { await navigator.clipboard.writeText(val); toast.success(label); }
  catch { toast.error("Clipboard access denied"); }
}

function toCSV(rows) {
  const H = ["Client","Type","Service","Provider","Login","Portal URL","Expiry","Notes","IP","Panel URL"];
  const lines = rows.map((r) =>
    [r.client_name, r.type, r.service_name, r.provider, r.login,
     r.portal_url, r.expiry, r.notes,
     r.meta?.ip_address ?? "", r.meta?.panel?.url ?? ""]
      .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [H.join(","), ...lines].join("\n");
}
function dlCSV(csv, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ── DaysBadge ───────────────────────────── */
function DaysBadge({ expiryStr }) {
  const u = getUrgency(expiryStr);
  if (u.days === null) return null;
  const label = u.days < 0
    ? `Exp ${Math.abs(u.days)}d ago`
    : u.days === 0 ? "Today"
    : `${u.days}d`;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${u.bg} ${u.border} ${u.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
      {label}
    </span>
  );
}

/* ── TypePill ────────────────────────────── */
function TypePill({ type }) {
  const dom = type?.toLowerCase() === "domain";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold
      ${dom ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}`}>
      {dom ? <Globe className="w-3 h-3" /> : <Server className="w-3 h-3" />}
      {dom ? "Domain" : "Hosting"}
    </span>
  );
}

/* ── Stats ───────────────────────────────── */
function StatsRow({ stats }) {
  const items = [
    { icon: ShieldCheck, label: "Services",  value: stats.total,    color: "text-gray-700",    iconBg: "bg-gray-100"      },
    { icon: Users,       label: "Clients",   value: stats.clients,  color: "text-sky-700",     iconBg: "bg-sky-100"       },
    { icon: Globe,       label: "Domains",   value: stats.domains,  color: "text-sky-700",     iconBg: "bg-sky-50"        },
    { icon: Server,      label: "Hosting",   value: stats.hosting,  color: "text-violet-700",  iconBg: "bg-violet-100"    },
    { icon: AlertCircle, label: "Critical",  value: stats.critical, color: "text-orange-700",  iconBg: "bg-orange-100"    },
    { icon: Clock,       label: "Expired",   value: stats.expired,  color: "text-red-700",     iconBg: "bg-red-100"       },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {items.map(({ icon: Icon, label, value, color, iconBg }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className={`text-xl font-semibold tabular-nums leading-none ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── RenewalAlerts ───────────────────────── */
function RenewalAlerts({ rows }) {
  const [expanded, setExpanded] = useState(false);
  const alerts = useMemo(() =>
    rows.filter((r) => { const u = getUrgency(r.expiry); return u.days !== null && u.days <= 30; })
        .sort((a, b) => (getUrgency(a.expiry).days ?? 9999) - (getUrgency(b.expiry).days ?? 9999)),
    [rows]
  );
  if (!alerts.length) return null;
  const expired  = alerts.filter((r) => (getUrgency(r.expiry).days ?? 0) < 0).length;
  const critical = alerts.filter((r) => { const d = getUrgency(r.expiry).days; return d !== null && d >= 0 && d <= 7; }).length;
  const visible  = expanded ? alerts : alerts.slice(0, 3);

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-50 rounded-md flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <span className="text-xs font-semibold text-gray-900">Renewal alerts</span>
          <span className="text-xs text-gray-400">
            {expired > 0 && <span className="text-red-500">{expired} expired · </span>}
            {critical > 0 && <span className="text-orange-500">{critical} critical · </span>}
            {alerts.length} within 30 days
          </span>
        </div>
        {alerts.length > 3 && (
          <button onClick={() => setExpanded((e) => !e)}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
            {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />+{alerts.length - 3} more</>}
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {visible.map((r) => {
          const u = getUrgency(r.expiry);
          return (
            <div key={`${r.clientId}-${r.serviceId}`}
              className={`flex items-center justify-between px-4 py-2.5 ${u.bg}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${u.dot}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {r.client_name} <span className="text-gray-400">·</span> {r.service_name}
                  </p>
                  <p className="text-xs text-gray-400">{r.provider} · {fmtDate(r.expiry)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <TypePill type={r.type} />
                <DaysBadge expiryStr={r.expiry} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── ClientCard ──────────────────────────── */
function ClientCard({ group, onClick }) {
  const domains  = group.services.filter((s) => s.type?.toLowerCase() === "domain");
  const hostings = group.services.filter((s) => s.type?.toLowerCase() === "hosting");

  const worstDays = group.services
    .map((s) => getUrgency(s.expiry).days)
    .filter((d) => d !== null)
    .sort((a, b) => a - b)[0] ?? null;

  const worstU = worstDays !== null
    ? getUrgency(group.services.find((s) => getUrgency(s.expiry).days === worstDays)?.expiry)
    : URGENCY_MAP.none;

  const stripeColor =
    worstU.dot === "bg-red-500"    ? "bg-red-400"
    : worstU.dot === "bg-orange-500" ? "bg-orange-400"
    : worstU.dot === "bg-amber-400"  ? "bg-amber-400"
    : worstU.dot === "bg-blue-500"   ? "bg-blue-400"
    : worstU.dot === "bg-emerald-500"? "bg-emerald-400"
    : "bg-gray-200";

  return (
    <button onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group">
      <div className={`h-[3px] w-full ${stripeColor}`} />
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-sky-600 transition-colors truncate">
            {group.client_name}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {domains.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded font-medium">
                <Globe className="w-2.5 h-2.5" />{domains.length}
              </span>
            )}
            {hostings.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded font-medium">
                <Server className="w-2.5 h-2.5" />{hostings.length}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {group.services
            .sort((a, b) => (getUrgency(a.expiry).days ?? 99999) - (getUrgency(b.expiry).days ?? 99999))
            .map((svc) => {
              const u = getUrgency(svc.expiry);
              return (
                <div key={svc.serviceId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {svc.type?.toLowerCase() === "domain"
                      ? <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                      : <Server className="w-3 h-3 text-violet-400 shrink-0" />
                    }
                    <span className="text-xs text-gray-500 truncate">{svc.service_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-gray-400">{fmtDate(svc.expiry)}</span>
                    {u.days !== null && (
                      <span className={`text-xs font-semibold ${u.color}`}>
                        {u.days < 0 ? "Exp" : u.days === 0 ? "Today" : `${u.days}d`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </button>
  );
}

/* ── ServiceRow (table) ──────────────────── */
function ServiceRow({ row, selected, onSelect, onEdit, onDelete, onView, showPwdId, onTogglePwd }) {
  const u = getUrgency(row.expiry);
  return (
    <tr className={`group transition-colors ${selected ? "bg-sky-50/50" : "hover:bg-gray-50/60"}`}>
      <td className="pl-4 pr-2 py-2.5 w-8">
        <button onClick={() => onSelect(row.serviceId)} className="text-gray-300 hover:text-gray-500">
          {selected ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="w-4 h-4" />}
        </button>
      </td>
      <td className="py-2.5 w-1 pr-2">
        <div className={`w-1 h-6 rounded-full ${u.dot}`} />
      </td>
      <td className="py-2.5 px-3">
        <button onClick={() => onView(row)}
          className="text-sm font-medium text-gray-900 hover:text-sky-600 transition-colors text-left">
          {row.client_name}
        </button>
      </td>
      <td className="py-2.5 px-3"><TypePill type={row.type} /></td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onView(row)}
            className="text-sm text-gray-700 font-medium hover:text-sky-600 transition-colors">
            {row.service_name}
          </button>
          {row.portal_url && (
            <a href={row.portal_url} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-sky-500">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="text-xs text-gray-400">{row.provider}</p>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-600">{row.login || "admin"}</span>
          <button onClick={() => copyText(row.login || "admin", "Login copied")}
            className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-gray-600">
            {showPwdId === row.serviceId ? (row.password || "—") : "•".repeat(10)}
          </span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onTogglePwd(row.serviceId)} className="text-gray-300 hover:text-gray-500">
              {showPwdId === row.serviceId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button onClick={() => copyText(row.password, "Password copied")} className="text-gray-300 hover:text-gray-500">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <p className="text-xs text-gray-500">{fmtDate(row.expiry)}</p>
        <DaysBadge expiryStr={row.expiry} />
      </td>
      <td className="py-2.5 px-3 pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-sm">
            <DropdownMenuItem onClick={() => onView(row)}><Eye className="w-3.5 h-3.5 mr-2" />View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => row.portal_url && window.open(row.portal_url, "_blank")} disabled={!row.portal_url}>
              <ExternalLink className="w-3.5 h-3.5 mr-2" />Open Portal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(row)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

/* ── ServiceCard (grid) ──────────────────── */
function ServiceCard({ row, selected, onSelect, onEdit, onDelete, onView, showPwdId, onTogglePwd }) {
  const u = getUrgency(row.expiry);
  const stripeColor =
    u.dot === "bg-red-500"     ? "bg-red-400"
    : u.dot === "bg-orange-500" ? "bg-orange-400"
    : u.dot === "bg-amber-400"  ? "bg-amber-400"
    : u.dot === "bg-blue-500"   ? "bg-blue-400"
    : u.dot === "bg-emerald-500"? "bg-emerald-400"
    : "bg-gray-200";

  return (
    <div className={`relative bg-white rounded-xl border transition-all hover:shadow-sm overflow-hidden
      ${selected ? "border-sky-400 ring-1 ring-sky-400/20" : "border-gray-100 hover:border-gray-200"}`}>
      <div className={`h-[3px] w-full ${stripeColor}`} />
      <div className="p-3.5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 min-w-0">
            <button onClick={() => onSelect(row.serviceId)} className="mt-0.5 shrink-0 text-gray-300 hover:text-gray-500">
              {selected ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="w-4 h-4" />}
            </button>
            <div className="min-w-0">
              <button onClick={() => onView(row)}
                className="text-sm font-semibold text-gray-900 truncate block hover:text-sky-600 transition-colors text-left">
                {row.service_name}
              </button>
              <p className="text-xs text-gray-400 truncate">{row.client_name}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-gray-100 text-gray-400 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-sm">
              <DropdownMenuItem onClick={() => onView(row)}><Eye className="w-3.5 h-3.5 mr-2" />View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(row)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <TypePill type={row.type} />
          <span className="text-xs text-gray-400">{row.provider}</span>
          {row.portal_url && (
            <a href={row.portal_url} target="_blank" rel="noreferrer" className="ml-auto text-gray-300 hover:text-sky-500">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1.5 text-xs mb-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Login</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-gray-700">{row.login || "admin"}</span>
              <button onClick={() => copyText(row.login || "admin", "Login copied")} className="text-gray-300 hover:text-gray-500">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Password</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-gray-700">
                {showPwdId === row.serviceId ? (row.password || "—") : "•".repeat(8)}
              </span>
              <button onClick={() => onTogglePwd(row.serviceId)} className="text-gray-300 hover:text-gray-500">
                {showPwdId === row.serviceId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <button onClick={() => copyText(row.password, "Password copied")} className="text-gray-300 hover:text-gray-500">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{fmtDate(row.expiry)}</span>
          <DaysBadge expiryStr={row.expiry} />
        </div>
      </div>
    </div>
  );
}

/* ── RenewalDialog ───────────────────────── */
function RenewalDialog({ row, open, onClose, onAdded, onDeleted }) {
  const [date,     setDate]     = useState("");
  const [duration, setDuration] = useState("1");
  const [cost,     setCost]     = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);

  const handleAdd = async () => {
    if (!date || !duration) { toast.error("Date and duration are required"); return; }
    setSaving(true);
    try {
      await addRenewal(row.clientId, row.serviceId, {
        date, duration: Number(duration), cost: cost ? Number(cost) : null, notes,
      });
      setDate(""); setDuration("1"); setCost(""); setNotes("");
      toast.success("Renewal added");
      onAdded?.();
    } catch { toast.error("Failed to add renewal"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (renewalId) => {
    try {
      await deleteRenewal(row.clientId, row.serviceId, renewalId);
      toast.success("Renewal deleted");
      onDeleted?.();
    } catch { toast.error("Failed to delete renewal"); }
  };

  const renewals = row?.meta?.renewal_history ?? [];
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md border-gray-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Renewal History</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {row?.service_name} · {row?.client_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Renewal</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Date *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-xs border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Duration (years) *</Label>
                <Input type="number" min="1" max="10" value={duration}
                  onChange={(e) => setDuration(e.target.value)} className="h-8 text-xs border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Cost (₹)</Label>
                <Input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)}
                  placeholder="Optional" className="h-8 text-xs border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional" className="h-8 text-xs border-gray-200" />
              </div>
            </div>
            <Button size="sm" onClick={handleAdd} disabled={saving}
              className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white w-full">
              {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
              <Plus className="w-3 h-3" />Add Renewal
            </Button>
          </div>
          {renewals.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                History ({renewals.length})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...renewals].reverse().map((r) => (
                  <div key={r.id}
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-gray-800">{fmtDate(r.date)}</p>
                      <p className="text-xs text-gray-400">
                        {r.duration}yr{r.cost ? ` · ₹${r.cost}` : ""}{r.notes ? ` · ${r.notes}` : ""}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(r.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <RotateCcw className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">No renewals recorded yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function CredentialsPage() {
  const navigate = useNavigate();
  const { withLoader } = useLoading();
  const [rows,         setRows]         = useState([]);
  const [clientsList,  setClientsList]  = useState([]);
  const [loading,      setLoading]      = useState(false);

  const [mainView,     setMainView]     = useState("clients");
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy,       setSortBy]       = useState("expiry");
  const [sortOrder,    setSortOrder]    = useState("asc");
  const [showPwdId,    setShowPwdId]    = useState(null);
  const [selected,     setSelected]     = useState(new Set());
  const [detailClientId, setDetailClientId] = useState(null);

  const [editRow,      setEditRow]      = useState(null);
  const [renewalRow,   setRenewalRow]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDlgOpen,  setBulkDlgOpen]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCredentials();
      setRows(data);
      const seen = new Map();
      data.forEach((r) => {
        if (!seen.has(r.clientId)) seen.set(r.clientId, { id: r.clientId, client_name: r.client_name, serviceCount: 0 });
        seen.get(r.clientId).serviceCount++;
      });
      setClientsList(Array.from(seen.values()).sort((a, b) => a.client_name.localeCompare(b.client_name)));
    } catch { toast.error("Failed to load credentials"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clientGroups = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (!map.has(r.clientId)) map.set(r.clientId, { clientId: r.clientId, client_name: r.client_name, services: [] });
      map.get(r.clientId).services.push(r);
    });
    let groups = Array.from(map.values());
    const q = search.toLowerCase();
    if (q) {
      groups = groups.filter((g) =>
        g.client_name.toLowerCase().includes(q) ||
        g.services.some((s) => [s.service_name, s.provider, s.notes ?? ""].some((v) => v.toLowerCase().includes(q)))
      );
    }
    if (filterType !== "all") {
      groups = groups.filter((g) => g.services.some((s) => s.type?.toLowerCase() === filterType));
    }
    groups.sort((a, b) => {
      const minDays = (g) => Math.min(...g.services.map((s) => getUrgency(s.expiry).days ?? 99999));
      return minDays(a) - minDays(b);
    });
    return groups;
  }, [rows, search, filterType]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let r = rows.filter((row) => {
      if (filterType !== "all" && row.type.toLowerCase() !== filterType) return false;
      if (filterStatus !== "all" && getUrgency(row.expiry).label.toLowerCase() !== filterStatus) return false;
      if (!q) return true;
      return [row.client_name, row.service_name, row.provider, row.login, row.notes ?? ""].some((v) => v.toLowerCase().includes(q));
    });
    r.sort((a, b) => {
      let av, bv;
      if      (sortBy === "expiry")  { av = getUrgency(a.expiry).days ?? 99999; bv = getUrgency(b.expiry).days ?? 99999; }
      else if (sortBy === "client")  { av = a.client_name.toLowerCase(); bv = b.client_name.toLowerCase(); }
      else if (sortBy === "service") { av = a.service_name.toLowerCase(); bv = b.service_name.toLowerCase(); }
      else { av = bv = 0; }
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [rows, search, filterType, filterStatus, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total:    rows.length,
    clients:  clientsList.length,
    domains:  rows.filter((r) => r.type.toLowerCase() === "domain").length,
    hosting:  rows.filter((r) => r.type.toLowerCase() === "hosting").length,
    critical: rows.filter((r) => { const d = getUrgency(r.expiry).days; return d !== null && d >= 0 && d <= 7; }).length,
    expired:  rows.filter((r) => (getUrgency(r.expiry).days ?? 0) < 0).length,
  }), [rows, clientsList]);

  const toggleSelect    = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.serviceId)));
  const clearSelection  = () => setSelected(new Set());

  const toggleSort = (f) => {
    if (sortBy === f) setSortOrder((o) => o === "asc" ? "desc" : "asc");
    else { setSortBy(f); setSortOrder("asc"); }
  };
  const SortIcon = ({ f }) => sortBy === f
    ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : null;
  const TH = ({ f, label, cls = "" }) => (
    <th onClick={() => f && toggleSort(f)}
      className={`text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider
        ${f ? "cursor-pointer hover:text-gray-700" : ""} select-none ${cls}`}>
      <span className="inline-flex items-center gap-1">{label}{f && <SortIcon f={f} />}</span>
    </th>
  );

  const handleEditSave = async (svc) => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateService(editRow.clientId, editRow.serviceId, svc);
      await fetchData();
      setEditRow(null);
      toast.success("Service updated");
    } catch (err) { toast.error(err?.response?.data?.error ?? "Failed to update"); }
    finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.clientId, deleteTarget.serviceId);
      await fetchData();
      setSelected((s) => { const n = new Set(s); n.delete(deleteTarget.serviceId); return n; });
      if (detailClientId === deleteTarget.clientId) {
        const remaining = rows.filter((r) => r.clientId === deleteTarget.clientId && r.serviceId !== deleteTarget.serviceId);
        if (remaining.length === 0) setDetailClientId(null);
      }
      toast.success("Service deleted");
    } catch { toast.error("Delete failed"); }
    finally { setDeleteTarget(null); }
  };

  const handleBulkDelete = async () => {
    const byClient = new Map();
    filtered.filter((r) => selected.has(r.serviceId)).forEach((r) => {
      if (!byClient.has(r.clientId)) byClient.set(r.clientId, []);
      byClient.get(r.clientId).push(r.serviceId);
    });
    try {
      for (const [cid, sids] of byClient.entries()) await bulkDeleteServices(cid, sids);
      await fetchData();
      clearSelection();
      setBulkDlgOpen(false);
      toast.success(`Deleted ${selected.size} service${selected.size !== 1 ? "s" : ""}`);
    } catch { toast.error("Bulk delete failed"); }
  };

  const handleExport = () => {
    const toExp = selected.size > 0 ? filtered.filter((r) => selected.has(r.serviceId)) : filtered;
    if (!toExp.length) { toast.error("Nothing to export"); return; }
    dlCSV(toCSV(toExp), `credentials-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success(`Exported ${toExp.length} service${toExp.length !== 1 ? "s" : ""}`);
  };

  const sharedRowProps = {
    showPwdId,
    onTogglePwd: (id) => setShowPwdId((c) => c === id ? null : id),
    onView:   (row) => { setDetailClientId(row.clientId); setMainView("clients"); },
    onEdit:   setEditRow,
    onDelete: setDeleteTarget,
    onSelect: toggleSelect,
  };

  /* ── Client detail view ── */
  if (detailClientId) {
    const group = clientGroups.find((g) => g.clientId === detailClientId)
      ?? {
        clientId: detailClientId,
        client_name: clientsList.find((c) => c.id === detailClientId)?.client_name ?? "Client",
        services: rows.filter((r) => r.clientId === detailClientId),
      };

    const handleAddService = () => {
      const params = new URLSearchParams({
        clientId:   group.clientId,
        clientName: group.client_name,
        ...(group.services.find((s) => s.customer_id)?.customer_id
          ? { customerId: group.services.find((s) => s.customer_id).customer_id }
          : {}),
      });
      navigate(`/dashboard/credentials/add?${params.toString()}`);
    };

    return (
      <>
        <ClientDetailPage
          clientId={group.clientId}
          clientName={group.client_name}
          services={group.services}
          onBack={() => setDetailClientId(null)}
          onEdit={setEditRow}
          onDelete={setDeleteTarget}
          onRenewal={setRenewalRow}
          onAddService={handleAddService}
        />
        <Dialog open={!!editRow} onOpenChange={(v) => { if (!v) setEditRow(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-200 bg-white">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Edit Service</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Update details for {editRow?.client_name}
              </DialogDescription>
            </DialogHeader>
            {editRow && (
              <ServiceForm initial={editRow} clientName={editRow.client_name}
                onSave={handleEditSave} onCancel={() => setEditRow(null)} saving={saving} />
            )}
          </DialogContent>
        </Dialog>
        <RenewalDialog row={renewalRow} open={!!renewalRow}
          onClose={() => setRenewalRow(null)} onAdded={fetchData} onDeleted={fetchData} />
        <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
          <AlertDialogContent className="border-gray-200 bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Delete Service</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-gray-500">
                Delete <strong className="text-gray-900">{deleteTarget?.service_name}</strong> for{" "}
                <strong className="text-gray-900">{deleteTarget?.client_name}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}
                className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  /* ── Main list ── */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-3">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Credentials</h1>
          <p className="text-xs text-gray-500">{stats.total} services · {stats.clients} clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}
            className="h-8 text-xs gap-1.5 border-gray-200 text-gray-600 hover:text-gray-900">
            <Download className="w-3.5 h-3.5" />
            {selected.size > 0 ? `Export (${selected.size})` : "Export"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}
            className="h-8 text-xs border-gray-200 text-gray-600 hover:text-gray-900">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => navigate("/dashboard/credentials/add")}
            className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="w-3.5 h-3.5" />Add Credential
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Renewal alerts */}
      <RenewalAlerts rows={rows} />

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client, service, provider…"
              className="pl-8 h-8 text-sm border-gray-200 bg-gray-50/60 focus:bg-white" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs w-[120px] border-gray-200">
                <Layers className="w-3 h-3 mr-1 text-gray-400" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="hosting">Hosting</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { v: "clients", icon: LayoutGrid, label: "Clients" },
                { v: "table",   icon: List,       label: "Table"   },
                { v: "grid",    icon: LayoutGrid,  label: "Grid"   },
              ].map(({ v, icon: Icon, label }, i) => (
                <button key={v} onClick={() => setMainView(v)}
                  className={`px-3 h-8 text-xs font-medium transition-colors flex items-center gap-1 shrink-0
                    ${mainView === v ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-700"}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clients view */}
      {mainView === "clients" && (
        clientGroups.length === 0
          ? <EmptyState onAdd={() => navigate("/dashboard/credentials/add")} hasFilter={!!search || filterType !== "all"} />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {clientGroups.map((group) => (
                <ClientCard key={group.clientId} group={group}
                  onClick={() => setDetailClientId(group.clientId)} />
              ))}
            </div>
          )
      )}

      {/* Table / Grid views */}
      {(mainView === "table" || mainView === "grid") && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-400">
              {filtered.length} of {rows.length} services
              {selected.size > 0 && (
                <span className="ml-2 text-sky-600 font-medium">· {selected.size} selected</span>
              )}
            </p>
            {selected.size > 0 && (
              <div className="flex items-center gap-3">
                <button onClick={() => setBulkDlgOpen(true)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />Delete selected
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
              </div>
            )}
          </div>

          {filtered.length === 0
            ? <EmptyState onAdd={() => navigate("/dashboard/credentials/add")}
                hasFilter={!!search || filterType !== "all" || filterStatus !== "all"} />
            : mainView === "table"
            ? (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-100 bg-gray-50/60">
                      <tr>
                        <th className="pl-4 pr-2 py-2.5 w-8">
                          <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                            {selected.size > 0 && selected.size === filtered.length
                              ? <CheckSquare className="w-4 h-4 text-sky-500" />
                              : <Square className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="w-1" />
                        <TH f="client"  label="Client"   />
                        <TH f={null}    label="Type"     />
                        <TH f="service" label="Service"  />
                        <TH f={null}    label="Login"    />
                        <TH f={null}    label="Password" />
                        <TH f="expiry"  label="Expiry"   />
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((row) => (
                        <ServiceRow key={row.serviceId} row={row}
                          selected={selected.has(row.serviceId)} {...sharedRowProps} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filtered.map((row) => (
                  <ServiceCard key={row.serviceId} row={row}
                    selected={selected.has(row.serviceId)} {...sharedRowProps} />
                ))}
              </div>
            )
          }
        </>
      )}

      {/* Dialogs */}
      <Dialog open={!!editRow && !detailClientId} onOpenChange={(v) => { if (!v) setEditRow(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Service</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Update details for {editRow?.client_name}
            </DialogDescription>
          </DialogHeader>
          {editRow && (
            <ServiceForm initial={editRow} clientName={editRow.client_name}
              onSave={handleEditSave} onCancel={() => setEditRow(null)} saving={saving} />
          )}
        </DialogContent>
      </Dialog>

      <RenewalDialog row={renewalRow} open={!!renewalRow && !detailClientId}
        onClose={() => setRenewalRow(null)} onAdded={fetchData} onDeleted={fetchData} />

      <AlertDialog open={!!deleteTarget && !detailClientId}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete Service</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Delete <strong className="text-gray-900">{deleteTarget?.service_name}</strong> for{" "}
              <strong className="text-gray-900">{deleteTarget?.client_name}</strong>?
              If this is their last service, the client record will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDlgOpen} onOpenChange={setBulkDlgOpen}>
        <AlertDialogContent className="border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              Delete {selected.size} Service{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              This will permanently delete {selected.size} selected service{selected.size !== 1 ? "s" : ""}.
              Client records with no remaining services will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">
              Delete {selected.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onAdd, hasFilter }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <Key className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">No credentials found</p>
      <p className="text-xs text-gray-400 mb-4">
        {hasFilter ? "Try adjusting your filters" : "Add your first credential to get started"}
      </p>
      {!hasFilter && (
        <Button size="sm" onClick={onAdd}
          className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
          <Plus className="w-3.5 h-3.5" />Add First Credential
        </Button>
      )}
    </div>
  );
}