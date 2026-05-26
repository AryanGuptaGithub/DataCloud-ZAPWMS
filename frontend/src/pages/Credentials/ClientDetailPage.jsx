// src/pages/Credentials/ClientDetailPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button }    from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Globe, Server, Copy, Eye, EyeOff, ExternalLink,
  Pencil, Trash2, MoreVertical, Plus, Wifi, Monitor,
  RotateCcw, Calendar, Hash, Users, Check,
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
  if (days < 0)   return { days, color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    label: `Expired ${Math.abs(days)}d ago` };
  if (days <= 7)  return { days, color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200", label: `${days}d left — critical` };
  if (days <= 30) return { days, color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  label: `${days}d left` };
  if (days <= 90) return { days, color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   label: `${days}d left` };
  return            { days, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: `${days}d left` };
}

/* ── ExpiryBadge ─────────────────────────── */
function ExpiryBadge({ expiryStr }) {
  const u = getUrgencyInfo(expiryStr);
  if (!u) return <span className="text-xs text-gray-400">No expiry set</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${u.bg} ${u.border} ${u.color}`}>
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
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        {link ? (
          <a href={value} target="_blank" rel="noreferrer"
            className={`text-xs text-sky-600 hover:underline truncate flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
            {value} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <span className={`text-xs text-gray-700 truncate ${mono ? "font-mono" : ""}`}>
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
          <div key={i} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="font-mono text-xs text-gray-700 truncate">{r}</span>
            <button onClick={() => copyText(r, "Copied")} className="text-gray-300 hover:text-gray-500 ml-2 shrink-0">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SectionLabel ────────────────────────── */
function SectionLabel({ icon: Icon, title, accent = "gray" }) {
  const colors = {
    sky:    "text-sky-600",
    violet: "text-violet-600",
    gray:   "text-gray-400",
  };
  return (
    <p className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${colors[accent]}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}{title}
    </p>
  );
}

/* ── FullServiceCard ─────────────────────── */
function FullServiceCard({ row, onEdit, onDelete, onRenewal }) {
  const isDomain = row.type?.toLowerCase() === "domain";
  const meta     = row.meta ?? {};
  const renewals = meta.renewal_history ?? [];

  const hasNameservers = (meta.nameservers?.length ?? 0) > 0;
  const hasServer      = !!(meta.ip_address || meta.server_details);
  const hasPanel       = !!meta.panel?.url;
  const hasDnsDetails  = Object.values(meta.dns_details ?? {}).some((a) => (a?.length ?? 0) > 0);
  const hasDomainMap   = (meta.domains?.length ?? 0) > 0;

  const accent = isDomain ? "sky" : "violet";
  const headerBg  = isDomain ? "bg-sky-50/50 border-sky-100"    : "bg-violet-50/50 border-violet-100";
  const iconBg    = isDomain ? "bg-sky-100 text-sky-600"         : "bg-violet-100 text-violet-600";
  const stripeClr = isDomain ? "bg-sky-400"                      : "bg-violet-400";

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col h-full">
      <div className={`h-[3px] w-full ${stripeClr}`} />

      {/* Card header */}
      <div className={`px-4 py-3 border-b ${headerBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              {isDomain ? <Globe className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{row.service_name}</p>
              <p className="text-xs text-gray-500">{row.provider || "—"}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-sm">
              <DropdownMenuItem onClick={() => onEdit(row)}>
                <Pencil className="w-3.5 h-3.5 mr-2" />Edit Service
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRenewal(row)}>
                <RotateCcw className="w-3.5 h-3.5 mr-2" />Renewal History
              </DropdownMenuItem>
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
      <div className="flex-1 divide-y divide-gray-50">

        {/* Info */}
        <div className="px-4 py-3">
          <SectionLabel title="Info" accent={accent} />
          <div className="bg-gray-50 rounded-lg px-3 py-1">
            <CopyRow label="Start Date"  value={fmtDate(meta.start_date)} mono={false} />
            <CopyRow label="Portal URL"  value={row.portal_url} link mono={false} />
            {row.notes && <CopyRow label="Notes" value={row.notes} mono={false} />}
          </div>
        </div>

        {/* Credentials */}
        <div className="px-4 py-3">
          <SectionLabel title="Credentials" accent={accent} />
          <div className="bg-gray-50 rounded-lg px-3 py-1">
            <CopyRow label="Login"    value={row.login || "admin"} />
            <CopyRow label="Password" value={row.password} secret />
          </div>
        </div>

        {/* Domain: nameservers */}
        {isDomain && hasNameservers && (
          <div className="px-4 py-3">
            <SectionLabel icon={Wifi} title="Nameservers" accent={accent} />
            <div className="space-y-0.5">
              {meta.nameservers.map((ns, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg">
                  <span className="font-mono text-xs text-gray-700">{ns}</span>
                  <button onClick={() => copyText(ns, "Copied")} className="text-gray-300 hover:text-gray-500">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hosting: server */}
        {!isDomain && hasServer && (
          <div className="px-4 py-3">
            <SectionLabel icon={Monitor} title="Server / VPS" accent={accent} />
            <div className="bg-gray-50 rounded-lg px-3 py-1">
              <CopyRow label="IP Address"   value={meta.ip_address} />
              <CopyRow label="Server Specs" value={meta.server_details} mono={false} />
            </div>
          </div>
        )}

        {/* Hosting: control panel */}
        {!isDomain && hasPanel && (
          <div className="px-4 py-3">
            <SectionLabel icon={Hash} title="Control Panel" accent={accent} />
            <div className="bg-gray-50 rounded-lg px-3 py-1">
              <CopyRow label="Panel URL" value={meta.panel.url}      link mono={false} />
              <CopyRow label="Username"  value={meta.panel.username} />
              <CopyRow label="Password"  value={meta.panel.password} secret />
            </div>
          </div>
        )}

        {/* Hosting: DNS records */}
        {!isDomain && hasDnsDetails && (
          <div className="px-4 py-3">
            <SectionLabel icon={Wifi} title="DNS Records" accent={accent} />
            <div className="space-y-2">
              <DnsRecordGroup label="Nameservers"   records={meta.dns_details?.nameservers} />
              <DnsRecordGroup label="A Records"     records={meta.dns_details?.A} />
              <DnsRecordGroup label="CNAME Records" records={meta.dns_details?.CNAME} />
              <DnsRecordGroup label="MX Records"    records={meta.dns_details?.MX} />
              <DnsRecordGroup label="TXT Records"   records={meta.dns_details?.TXT} />
            </div>
          </div>
        )}

        {/* Hosting: domain mapping */}
        {!isDomain && hasDomainMap && (
          <div className="px-4 py-3">
            <SectionLabel icon={Globe} title="Domain Mapping" accent={accent} />
            <div className="space-y-2">
              {meta.domains.map((d, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-800">{d.domain || "—"}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 capitalize">{d.type}</span>
                    <button onClick={() => copyText(d.domain, "Domain copied")}
                      className="text-gray-300 hover:text-gray-500 ml-auto">
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
          </div>
        )}

        {/* Renewal history */}
        {renewals.length > 0 && (
          <div className="px-4 py-3">
            <SectionLabel icon={RotateCcw} title={`Renewal History (${renewals.length})`} accent={accent} />
            <div className="space-y-1">
              {[...renewals].reverse().map((r, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg text-xs">
                  <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-700">{fmtDate(r.date)}</span>
                  <span className="text-gray-400">{r.duration}yr</span>
                  {r.cost && <span className="text-gray-400">₹{r.cost}</span>}
                  {r.notes && <span className="text-gray-400 truncate">{r.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onRenewal(row)}
          className="h-7 text-xs gap-1 border-gray-200 flex-1 hover:bg-gray-50">
          <RotateCcw className="w-3 h-3" />Renewal
        </Button>
        <Button size="sm" onClick={() => onEdit(row)}
          className="h-7 text-xs gap-1 bg-gray-900 hover:bg-gray-800 text-white flex-1">
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
    <div className={`border-2 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center h-full min-h-[220px]
      ${isDomain ? "border-sky-200 bg-sky-50/30" : "border-violet-200 bg-violet-50/30"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
        ${isDomain ? "bg-sky-100" : "bg-violet-100"}`}>
        {isDomain
          ? <Globe className="w-4.5 h-4.5 text-sky-600" />
          : <Server className="w-4.5 h-4.5 text-violet-600" />}
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">No {type} service</p>
      <p className="text-xs text-gray-400 mb-3">Add a {type.toLowerCase()} service for this client.</p>
      <Button size="sm" variant="outline" onClick={onAdd}
        className={`h-7 text-xs gap-1 ${isDomain
          ? "border-sky-200 text-sky-700 hover:bg-sky-50"
          : "border-violet-200 text-violet-700 hover:bg-violet-50"}`}>
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

  const resolvedCustomerId = customer_id
    ?? services.find((s) => s.customer_id)?.customer_id
    ?? null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-4">

      {/* Back nav */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />All Clients
      </button>

      {/* Client header */}
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{clientName}</h1>
              {resolvedCustomerId && (
                <button type="button" onClick={() => navigate("/dashboard/customers")}
                  className="inline-flex items-center gap-1 text-xs text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-medium hover:bg-sky-100 transition-colors">
                  <Users className="w-3 h-3" />View Profile
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {domains.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md font-medium">
                  <Globe className="w-3 h-3" />{domains.length} Domain{domains.length !== 1 ? "s" : ""}
                </span>
              )}
              {hostings.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md font-medium">
                  <Server className="w-3 h-3" />{hostings.length} Hosting{hostings.length !== 1 ? " Plans" : " Plan"}
                </span>
              )}
            </div>
          </div>

          {/* Expiry chips + Add button */}
          <div className="flex flex-wrap items-center gap-2">
            {services
              .filter((s) => s.expiry)
              .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
              .map((s, i) => {
                const u = getUrgencyInfo(s.expiry);
                if (!u) return null;
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    {s.type?.toLowerCase() === "domain"
                      ? <Globe className="w-3 h-3 text-sky-500 shrink-0" />
                      : <Server className="w-3 h-3 text-violet-500 shrink-0" />}
                    <span className="text-xs text-gray-500">{s.service_name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${u.bg} ${u.border} ${u.color}`}>
                      <Calendar className="w-3 h-3" />
                      {fmtDate(s.expiry)} · {u.label}
                    </span>
                  </div>
                );
              })}
            <Button size="sm" onClick={onAddService}
              className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white shrink-0">
              <Plus className="w-3.5 h-3.5" />Add Service
            </Button>
          </div>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Domains column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded bg-sky-100 flex items-center justify-center">
              <Globe className="w-3 h-3 text-sky-600" />
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
            <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center">
              <Server className="w-3 h-3 text-violet-600" />
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