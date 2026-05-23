// src/pages/Credentials/ClientDetailPage.jsx
/**
 * ClientDetailPage
 * Shows all services for a client.
 * Desktop: Domain + Hosting side by side (no tabs).
 * Mobile: stacked.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Globe, Server, Copy, Eye, EyeOff, ExternalLink,
  Pencil, Trash2, MoreVertical, Plus, Wifi, Monitor,
  RotateCcw, Calendar, Hash, Users,
} from "lucide-react";
import { differenceInDays, format, isValid } from "date-fns";
import { toast } from "sonner";

/* ── helpers ─────────────────────────────── */
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

function getUrgencyInfo(expiryStr) {
  if (!expiryStr) return null;
  const d = new Date(expiryStr);
  if (!isValid(d)) return null;
  const days = differenceInDays(d, new Date());
  if (days < 0)   return { days, color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/40",       border: "border-red-200 dark:border-red-900",      label: `Expired ${Math.abs(days)}d ago` };
  if (days <= 7)  return { days, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-900", label: `${days}d left — critical` };
  if (days <= 30) return { days, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/40", border: "border-yellow-200 dark:border-yellow-900", label: `${days}d left` };
  if (days <= 90) return { days, color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40",     border: "border-blue-200 dark:border-blue-900",     label: `${days}d left` };
  return { days, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-900", label: `${days}d left` };
}

/* ── ExpiryBadge ─────────────────────────── */
function ExpiryBadge({ expiryStr }) {
  const u = getUrgencyInfo(expiryStr);
  if (!u) return <span className="text-xs text-gray-400">No expiry set</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${u.bg} ${u.border} ${u.color}`}>
      <Calendar className="w-3 h-3" />
      {fmtDate(expiryStr)} · {u.label}
    </span>
  );
}

/* ── CopyRow ─────────────────────────────── */
function CopyRow({ label, value, mono = true, link = false, secret = false }) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        {link ? (
          <a href={value} target="_blank" rel="noreferrer"
            className={`text-xs text-sky-600 hover:underline truncate flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
            {value} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <span className={`text-xs text-gray-700 dark:text-gray-300 truncate ${mono ? "font-mono" : ""}`}>
            {secret && !show ? "•".repeat(Math.min(value.length, 12)) : value}
          </span>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          {secret && (
            <button onClick={() => setShow((s) => !s)} className="p-0.5 text-gray-300 hover:text-gray-500">
              {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
          {!link && (
            <button onClick={() => copyText(value, `${label} copied`)} className="p-0.5 text-gray-300 hover:text-gray-500">
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── DnsRecordGroup ──────────────────────── */
function DnsRecordGroup({ label, records }) {
  if (!records?.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="space-y-0.5">
        {records.map((r, i) => (
          <div key={i} className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">{r}</span>
            <button onClick={() => copyText(r, "Copied")} className="text-gray-300 hover:text-gray-500 ml-2 shrink-0">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section wrapper ─────────────────────── */
function Section({ title, icon: Icon, children, accent }) {
  const colors = {
    sky: "text-sky-500",
    violet: "text-violet-500",
    gray: "text-gray-400",
  };
  return (
    <div className="space-y-2">
      <p className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${colors[accent] ?? colors.gray}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}{title}
      </p>
      {children}
    </div>
  );
}

/* ── FullServiceCard ─────────────────────── */
function FullServiceCard({ row, onEdit, onDelete, onRenewal, accentColor }) {
  const isDomain = row.type?.toLowerCase() === "domain";
  const meta     = row.meta ?? {};
  const renewals = meta.renewal_history ?? [];

  const hasNameservers = (meta.nameservers?.length ?? 0) > 0;
  const hasServer      = !!(meta.ip_address || meta.server_details);
  const hasPanel       = !!meta.panel?.url;
  const hasDnsDetails  = Object.values(meta.dns_details ?? {}).some((a) => (a?.length ?? 0) > 0);
  const hasDomainMap   = (meta.domains?.length ?? 0) > 0;

  const accent = isDomain ? "sky" : "violet";
  const headerBg = isDomain
    ? "bg-sky-50/60 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/40"
    : "bg-violet-50/60 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40";
  const iconBg = isDomain
    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400"
    : "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Card header */}
      <div className={`px-4 py-3 border-b ${headerBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              {isDomain ? <Globe className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{row.service_name}</p>
              <p className="text-xs text-gray-500">{row.provider || "—"}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 shrink-0">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-sm">
              <DropdownMenuItem onClick={() => onEdit(row)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit Service</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRenewal(row)}><RotateCcw className="w-3.5 h-3.5 mr-2" />Renewal History</DropdownMenuItem>
              {row.portal_url && (
                <DropdownMenuItem onClick={() => window.open(row.portal_url, "_blank")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />Open Portal
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(row)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2">
          <ExpiryBadge expiryStr={row.expiry} />
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-4 flex-1">

        {/* Info */}
        <Section title="Info" accent={accent}>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1">
            <CopyRow label="Start Date"  value={fmtDate(meta.start_date)} mono={false} />
            <CopyRow label="Portal URL"  value={row.portal_url} link mono={false} />
            {row.notes && <CopyRow label="Notes" value={row.notes} mono={false} />}
          </div>
        </Section>

        {/* Credentials */}
        <Section title="Credentials" accent={accent}>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1">
            <CopyRow label="Login"    value={row.login || "admin"} />
            <CopyRow label="Password" value={row.password} secret />
          </div>
        </Section>

        {/* Domain: nameservers */}
        {isDomain && hasNameservers && (
          <Section title="Nameservers" icon={Wifi} accent={accent}>
            <div className="space-y-0.5">
              {meta.nameservers.map((ns, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{ns}</span>
                  <button onClick={() => copyText(ns, "Copied")} className="text-gray-300 hover:text-gray-500">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Hosting: server */}
        {!isDomain && hasServer && (
          <Section title="Server / VPS" icon={Monitor} accent={accent}>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1">
              <CopyRow label="IP Address"   value={meta.ip_address} />
              <CopyRow label="Server Specs" value={meta.server_details} mono={false} />
            </div>
          </Section>
        )}

        {/* Hosting: control panel */}
        {!isDomain && hasPanel && (
          <Section title="Control Panel" icon={Hash} accent={accent}>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1">
              <CopyRow label="Panel URL"      value={meta.panel.url}      link mono={false} />
              <CopyRow label="Username"       value={meta.panel.username} />
              <CopyRow label="Password"       value={meta.panel.password} secret />
            </div>
          </Section>
        )}

        {/* Hosting: DNS records */}
        {!isDomain && hasDnsDetails && (
          <Section title="DNS Records" icon={Wifi} accent={accent}>
            <div className="space-y-2">
              <DnsRecordGroup label="Nameservers"   records={meta.dns_details?.nameservers} />
              <DnsRecordGroup label="A Records"     records={meta.dns_details?.A} />
              <DnsRecordGroup label="CNAME Records" records={meta.dns_details?.CNAME} />
              <DnsRecordGroup label="MX Records"    records={meta.dns_details?.MX} />
              <DnsRecordGroup label="TXT Records"   records={meta.dns_details?.TXT} />
            </div>
          </Section>
        )}

        {/* Hosting: domain mapping */}
        {!isDomain && hasDomainMap && (
          <Section title="Domain Mapping" icon={Globe} accent={accent}>
            <div className="space-y-2">
              {meta.domains.map((d, i) => (
                <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{d.domain || "—"}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 capitalize">{d.type}</span>
                    <button onClick={() => copyText(d.domain, "Domain copied")} className="text-gray-300 hover:text-gray-500 ml-auto">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DnsRecordGroup label="A"     records={d.records?.A} />
                    <DnsRecordGroup label="CNAME" records={d.records?.CNAME} />
                    <DnsRecordGroup label="MX"    records={d.records?.MX} />
                    <DnsRecordGroup label="TXT"   records={d.records?.TXT} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Renewal history */}
        {renewals.length > 0 && (
          <Section title={`Renewal History (${renewals.length})`} icon={RotateCcw} accent={accent}>
            <div className="space-y-1">
              {[...renewals].reverse().map((r, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                  <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{fmtDate(r.date)}</span>
                  <span className="text-gray-400">{r.duration}yr</span>
                  {r.cost && <span className="text-gray-400">₹{r.cost}</span>}
                  {r.notes && <span className="text-gray-400 truncate">{r.notes}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Action buttons — pinned to bottom */}
      <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onRenewal(row)}
          className="h-7 text-xs gap-1 border-gray-200 dark:border-gray-700 flex-1">
          <RotateCcw className="w-3 h-3" />Renewal
        </Button>
        <Button size="sm" onClick={() => onEdit(row)}
          className="h-7 text-xs gap-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white flex-1">
          <Pencil className="w-3 h-3" />Edit
        </Button>
      </div>
    </div>
  );
}

/* ── EmptyPanel ──────────────────────────── */
function EmptyPanel({ type, onAdd }) {
  const isDomain = type === "Domain";
  return (
    <div className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[200px]
      ${isDomain ? "border-sky-200 dark:border-sky-900/50" : "border-violet-200 dark:border-violet-900/50"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5
        ${isDomain ? "bg-sky-50 dark:bg-sky-950/40" : "bg-violet-50 dark:bg-violet-950/40"}`}>
        {isDomain
          ? <Globe className="w-4 h-4 text-sky-500" />
          : <Server className="w-4 h-4 text-violet-500" />}
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No {type} service</p>
      <p className="text-xs text-gray-400 mb-3">Add a {type.toLowerCase()} service for this client.</p>
      <Button size="sm" variant="outline" onClick={onAdd}
        className="h-7 text-xs gap-1 border-gray-200 dark:border-gray-700">
        <Plus className="w-3 h-3" />Add {type}
      </Button>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function ClientDetailPage({
  clientId, clientName, services, customer_id,
  onBack, onEdit, onDelete, onRenewal, onAddService,
}) {
  const navigate = useNavigate();
  const domains  = services.filter((s) => s.type?.toLowerCase() === "domain");
  const hostings = services.filter((s) => s.type?.toLowerCase() === "hosting");

  // customer_id might live on any service row — grab the first one found
  const resolvedCustomerId = customer_id
    ?? services.find((s) => s.customer_id)?.customer_id
    ?? null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 space-y-4">

      {/* Back nav */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />All Clients
      </button>

      {/* Client header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{clientName}</h1>
              {resolvedCustomerId && (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/customers")}
                  className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 px-2 py-0.5 rounded-md font-medium hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors">
                  <Users className="w-3 h-3" />View Client Profile
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {domains.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 px-2 py-0.5 rounded-md font-medium">
                  <Globe className="w-3 h-3" />{domains.length} Domain{domains.length !== 1 ? "s" : ""}
                </span>
              )}
              {hostings.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 px-2 py-0.5 rounded-md font-medium">
                  <Server className="w-3 h-3" />{hostings.length} Hosting{hostings.length !== 1 ? " Plans" : " Plan"}
                </span>
              )}
            </div>
          </div>

          {/* Expiry summary — compact */}
          <div className="flex flex-wrap gap-2">
            {services
              .filter((s) => s.expiry)
              .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
              .map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {s.type?.toLowerCase() === "domain"
                    ? <Globe className="w-3 h-3 text-sky-500 shrink-0" />
                    : <Server className="w-3 h-3 text-violet-500 shrink-0" />}
                  <span className="text-xs text-gray-500">{s.service_name}</span>
                  <ExpiryBadge expiryStr={s.expiry} />
                </div>
              ))}
          </div>

          <Button size="sm" onClick={onAddService}
            className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white shrink-0">
            <Plus className="w-3.5 h-3.5" />Add Service
          </Button>
        </div>
      </div>

      {/* ── Side-by-side panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Domain column */}
        <div className="space-y-3">
          {/* Column label */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <Globe className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Domain{domains.length !== 1 ? "s" : ""} · {domains.length}
            </span>
          </div>

          {domains.length > 0
            ? domains.map((row) => (
                <FullServiceCard key={row.serviceId} row={row}
                  onEdit={onEdit} onDelete={onDelete} onRenewal={onRenewal} />
              ))
            : <EmptyPanel type="Domain" onAdd={onAddService} />
          }
        </div>

        {/* Hosting column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Server className="w-3 h-3 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Hosting · {hostings.length}
            </span>
          </div>

          {hostings.length > 0
            ? hostings.map((row) => (
                <FullServiceCard key={row.serviceId} row={row}
                  onEdit={onEdit} onDelete={onDelete} onRenewal={onRenewal} />
              ))
            : <EmptyPanel type="Hosting" onAdd={onAddService} />
          }
        </div>
      </div>
    </div>
  );
}