// frontend/src/pages/Customers.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listClients, deleteClient } from "@/lib/clients";
import { createClient, updateClient } from "@/lib/clients";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Badge }     from "@/components/ui/badge";
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
import { format, isValid, subMonths } from "date-fns";
import ClientForm       from "./Clients/ClientForm";
import ClientDetailView from "./Clients/ClientDetailView";
import {
  Search, Plus, Users, Mail, Phone, Shield, Calendar,
  RefreshCw, Download, Upload, Trash2, Eye, Pencil,
  MoreVertical, ChevronLeft, ChevronRight, X,
  CheckSquare, Square, Grid3x3, AlignJustify,
  Building2, MapPin, Filter,
} from "lucide-react";

/* ── category pill ───────────────────────── */
const CAT = {
  premium:  "bg-amber-50 text-amber-700 border-amber-200",
  regular:  "bg-sky-50 text-sky-700 border-sky-200",
  lead:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  prospect: "bg-violet-50 text-violet-700 border-violet-200",
};

function CategoryPill({ value }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${CAT[value] ?? CAT.regular}`}>
      {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Regular"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  const colors = {
    gray:    "bg-gray-100 text-gray-500",
    sky:     "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange:  "bg-orange-100 text-orange-600",
    violet:  "bg-violet-100 text-violet-600",
    amber:   "bg-amber-100 text-amber-600",
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors[accent] ?? colors.gray}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── CSV export helper ───────────────────── */
function exportCSV(clients) {
  const H = ["Client Name","Company","Designation","Email","Phone","City","GSTIN","Category","Tags","Notes","Follow-up Date","Created"];
  const rows = clients.map((c) => [
    c.clientName, c.companyName, c.clientDesignation, c.email,
    c.phone, c.city, c.gstin, c.category,
    (c.tags ?? []).join(";"), c.notes,
    c.followUpDate ? format(new Date(c.followUpDate), "yyyy-MM-dd") : "",
    c.created_at   ? format(new Date(c.created_at),   "yyyy-MM-dd") : "",
  ].map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [H.join(","), ...rows].join("\n");
  const a   = document.createElement("a");
  a.href    = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `clients-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

const TABS = [
  { id: "all",            label: "All"        },
  { id: "recent",         label: "Recent"     },
  { id: "without-email",  label: "No Email"   },
  { id: "without-phone",  label: "No Phone"   },
];

const PER_PAGE_OPTS = [10, 25, 50];

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function Customers() {
  const navigate = useNavigate();

  /* ── state ── */
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [tab,        setTab]        = useState("all");
  const [sortBy,     setSortBy]     = useState("newest");
  const [viewMode,   setViewMode]   = useState("table");
  const [perPage,    setPerPage]    = useState(10);
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState(new Set());

  // dialogs
  const [addOpen,    setAddOpen]    = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [deleteTgt,  setDeleteTgt]  = useState(null);
  const [bulkDlg,    setBulkDlg]    = useState(false);

  /* ── fetch ── */
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listClients();
      setClients(data);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  /* ── filtered + sorted ── */
  const filtered = useMemo(() => {
    const q   = search.toLowerCase();
    const ago = subMonths(new Date(), 1);

    let r = clients.filter((c) => {
      // tab
      if (tab === "recent"        && new Date(c.created_at) < ago) return false;
      if (tab === "without-email" && c.email)                       return false;
      if (tab === "without-phone" && c.phone)                       return false;
      // search
      if (q && ![c.clientName, c.companyName, c.email, c.phone, c.city, c.gstin]
        .some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });

    r.sort((a, b) => {
      if (sortBy === "name-asc")  return (a.clientName ?? "").localeCompare(b.clientName ?? "");
      if (sortBy === "name-desc") return (b.clientName ?? "").localeCompare(a.clientName ?? "");
      if (sortBy === "oldest")    return new Date(a.created_at) - new Date(b.created_at);
      return new Date(b.created_at) - new Date(a.created_at); // newest
    });

    return r;
  }, [clients, search, tab, sortBy]);

  /* ── pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => { setPage(1); }, [search, tab, sortBy, perPage]);

  /* ── stats ── */
  const stats = useMemo(() => {
    const ago = subMonths(new Date(), 1);
    return {
      total:    clients.length,
      withEmail: clients.filter((c) => c.email).length,
      withPhone: clients.filter((c) => c.phone).length,
      withGSTIN: clients.filter((c) => c.gstin).length,
      recent:   clients.filter((c) => new Date(c.created_at) >= ago).length,
    };
  }, [clients]);

  /* ── selection ── */
  const toggleSelect    = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(selected.size === pageSlice.length ? new Set() : new Set(pageSlice.map((c) => c._id)));
  const clearSelection  = () => setSelected(new Set());

  /* ── handlers ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTgt) return;
    try {
      await deleteClient(deleteTgt._id);
      setClients((prev) => prev.filter((c) => c._id !== deleteTgt._id));
      selected.delete(deleteTgt._id);
      setSelected(new Set(selected));
      toast.success("Client deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTgt(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selected) await deleteClient(id);
      setClients((prev) => prev.filter((c) => !selected.has(c._id)));
      toast.success(`Deleted ${selected.size} client${selected.size !== 1 ? "s" : ""}`);
      clearSelection();
      setBulkDlg(false);
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const handleExport = () => {
    const toExp = selected.size > 0 ? filtered.filter((c) => selected.has(c._id)) : filtered;
    if (!toExp.length) { toast.error("Nothing to export"); return; }
    exportCSV(toExp);
    toast.success(`Exported ${toExp.length} client${toExp.length !== 1 ? "s" : ""}`);
  };

  /* ── table sort header ── */
  const TH = ({ label, cls = "" }) => (
    <th className={`text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${cls}`}>
      {label}
    </th>
  );

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.total} total clients</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}
            className="h-8 text-xs gap-1.5 border-gray-200">
            <Download className="w-3.5 h-3.5" />
            {selected.size > 0 ? `Export (${selected.size})` : "Export"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/clients/import")}
            className="h-8 text-xs gap-1.5 border-gray-200">
            <Upload className="w-3.5 h-3.5" />Import
          </Button>
          <Button variant="outline" size="sm" onClick={fetchClients} disabled={loading}
            className="h-8 text-xs border-gray-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}
            className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="w-3.5 h-3.5" />Add Client
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Users}    label="Total"       value={stats.total}     accent="gray"    />
        <StatCard icon={Mail}     label="With Email"  value={stats.withEmail} accent="sky"     />
        <StatCard icon={Phone}    label="With Phone"  value={stats.withPhone} accent="emerald" />
        <StatCard icon={Shield}   label="With GSTIN"  value={stats.withGSTIN} accent="violet"  />
        <StatCard icon={Calendar} label="This Month"  value={stats.recent}    accent="amber"   />
      </div>

      {/* ── Filters toolbar ── */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3 border-gray-300">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email, phone..."
              className="pl-9 h-8 text-sm border-gray-200 bg-gray-50" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-[130px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100">
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="name-desc">Name Z–A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="h-8 text-xs w-[70px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100">
                {PER_PAGE_OPTS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[["table", AlignJustify], ["grid", Grid3x3]].map(([v, Icon]) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-2.5 h-8 flex items-center transition-colors
                    ${viewMode === v ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 -mx-4 px-4 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                ${tab === id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Result count + bulk actions */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
            {selected.size > 0 && <span className="ml-2 text-sky-600 font-medium">· {selected.size} selected</span>}
          </p>
          {selected.size > 0 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setBulkDlg(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 bg-red-200 rounded-md px-2 py-1">
                <Trash2 className="w-3 h-3" />Delete selected
              </button>
              <span className="text-gray-300 text-xs">|</span>
              <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No clients found</p>
          <p className="text-xs text-gray-400 mb-4">
            {search ? "Try adjusting your search" : "Add your first client to get started"}
          </p>
          {!search && (
            <Button size="sm" onClick={() => setAddOpen(true)}
              className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="w-3.5 h-3.5" />Add First Client
            </Button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* ── TABLE ── */
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-gray-400">
              <thead className="border-b border-gray-100 bg-gray-50/60">
                <tr >
                  <th className="pl-4 pr-2 py-2.5 w-8">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selected.size > 0 && selected.size === pageSlice.length
                        ? <CheckSquare className="w-4 h-4 text-sky-500" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <TH label="Client"   />
                  <TH label="Company"  cls="hidden sm:table-cell" />
                  <TH label="Contact"  cls="hidden lg:table-cell" />
                  <TH label="City"     cls="hidden md:table-cell" />
                  <TH label="Category" cls="hidden sm:table-cell" />
                  <TH label="Added"    />
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageSlice.map((client) => (
                  <tr key={client._id}
                    className={`group transition-colors ${selected.has(client._id) ? "bg-sky-50/50" : "hover:bg-gray-50/80"}`}>
                    <td className="pl-4 pr-2 py-3 w-8">
                      <button onClick={() => toggleSelect(client._id)} className="text-gray-300 hover:text-gray-500">
                        {selected.has(client._id) ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-sm font-medium text-gray-900">{client.clientName}</p>
                      {client.clientDesignation && (
                        <p className="text-xs text-gray-400">{client.clientDesignation}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600 truncate max-w-[140px]">{client.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 truncate max-w-[150px]">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      {client.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{client.city}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <CategoryPill value={client.category} />
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-xs text-gray-400">
                        {client.created_at && isValid(new Date(client.created_at))
                          ? format(new Date(client.created_at), "dd MMM")
                          : "—"}
                      </p>
                    </td>
                    <td className="py-3 px-3 pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-sm">
                          <DropdownMenuItem onClick={() => setViewClient(client)}>
                            <Eye className="w-3.5 h-3.5 mr-2" />View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditClient(client)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteTgt(client)}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── GRID ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {pageSlice.map((client) => (
            <div key={client._id}
              className={`relative bg-white rounded-xl border transition-all hover:shadow-sm
                ${selected.has(client._id)
                  ? "border-sky-400 ring-1 ring-sky-400/20"
                  : "border-gray-100 hover:border-gray-200"}`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <button onClick={() => toggleSelect(client._id)} className="mt-0.5 shrink-0 text-gray-300 hover:text-gray-500">
                      {selected.has(client._id) ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{client.clientName}</p>
                      <p className="text-xs text-gray-500 truncate">{client.companyName}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-gray-100 text-gray-400 shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-sm">
                      <DropdownMenuItem onClick={() => setViewClient(client)}><Eye className="w-3.5 h-3.5 mr-2" />View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditClient(client)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteTgt(client)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CategoryPill value={client.category} />

                <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                  {client.email  && <div className="flex items-center gap-1.5"><Mail    className="w-3 h-3 shrink-0" /><span className="truncate">{client.email}</span></div>}
                  {client.phone  && <div className="flex items-center gap-1.5"><Phone   className="w-3 h-3 shrink-0" /><span>{client.phone}</span></div>}
                  {client.city   && <div className="flex items-center gap-1.5"><MapPin  className="w-3 h-3 shrink-0" /><span>{client.city}</span></div>}
                </div>

                {client.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {client.tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{t}</span>
                    ))}
                    {client.tags.length > 3 && <span className="text-xs text-gray-400">+{client.tags.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5)            p = i + 1;
              else if (safePage <= 3)         p = i + 1;
              else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
              else                            p = safePage - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${p === safePage
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══ DIALOGS ══ */}

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Client</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Fill in the client details below.</DialogDescription>
          </DialogHeader>
          <ClientForm
            onSuccess={() => { setAddOpen(false); fetchClients(); }}
            onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editClient} onOpenChange={(v) => { if (!v) setEditClient(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Client</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Update client details.</DialogDescription>
          </DialogHeader>
          {editClient && (
            <ClientForm
              initialData={editClient}
              onSuccess={() => { setEditClient(null); fetchClients(); }}
              onCancel={() => setEditClient(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={!!viewClient} onOpenChange={(v) => { if (!v) setViewClient(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-200 bg-white">
          {viewClient && (
            <ClientDetailView
              client={viewClient}
              onEdit={() => { setEditClient(viewClient); setViewClient(null); }}
              onClose={() => setViewClient(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog open={!!deleteTgt} onOpenChange={(v) => { if (!v) setDeleteTgt(null); }}>
        <AlertDialogContent className="border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete Client</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Delete <span className="font-medium text-gray-900">{deleteTgt?.clientName}</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDlg} onOpenChange={setBulkDlg}>
        <AlertDialogContent className="border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete {selected.size} Client{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              This will permanently delete {selected.size} selected client{selected.size !== 1 ? "s" : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">
              Delete {selected.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}