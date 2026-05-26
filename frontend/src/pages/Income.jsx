// src/pages/Income.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listIncomes, deleteIncome, exportIncomesToCSV } from "@/lib/incomes";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Badge }   from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search, Plus, Download, Upload, RefreshCw,
  TrendingUp, Wallet, CalendarDays, Sparkles,
  Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight,
  CheckSquare, Square, X, Filter,
  Banknote, CreditCard, Globe, FileText,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth,
  subMonths, isValid,
} from "date-fns";
import IncomeChart from "./Income/IncomeChart";

/* ── helpers ─────────────────────────────── */
const INR = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const fmtDate = (s) => { const d = new Date(s); return isValid(d) ? format(d, "dd MMM yyyy") : "—"; };

const STATUS_CLS = {
  received:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const PAY_ICON = { cash: Banknote, card: CreditCard, bank: Wallet, online: Globe, check: FileText };

const TABS = [
  { id: "all",     label: "All"         },
  { id: "recent",  label: "Recent (7d)" },
  { id: "large",   label: "₹10k+"       },
  { id: "pending", label: "Pending"     },
];

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-600",
    sky:     "bg-sky-100 text-sky-600",
    violet:  "bg-violet-100 text-violet-600",
    orange:  "bg-orange-100 text-orange-600",
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors[accent] ?? colors.emerald}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function Income() {
  const navigate = useNavigate();
  const [incomes,   setIncomes]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [tab,       setTab]       = useState("all");
  const [sortBy,    setSortBy]    = useState("date-desc");
  const [dateRange, setDateRange] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [perPage,   setPerPage]   = useState(10);
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(new Set());
  const [deleteTgt, setDeleteTgt] = useState(null);
  const [bulkDlg,   setBulkDlg]   = useState(false);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listIncomes();
      setIncomes(data);
    } catch { toast.error("Failed to load incomes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  /* stats */
  const stats = useMemo(() => {
    const now   = new Date();
    const mStart = startOfMonth(now);
    const mEnd   = endOfMonth(now);
    const lStart = startOfMonth(subMonths(now, 1));
    const lEnd   = endOfMonth(subMonths(now, 1));

    const sum = (arr) => arr.reduce((s, r) => s + (r.amount || 0), 0);
    const total     = sum(incomes);
    const thisMonth = sum(incomes.filter((r) => { const d = new Date(r.date); return d >= mStart && d <= mEnd; }));
    const lastMonth = sum(incomes.filter((r) => { const d = new Date(r.date); return d >= lStart && d <= lEnd; }));
    const today     = sum(incomes.filter((r) => r.date === format(now, "yyyy-MM-dd")));
    return { total, thisMonth, lastMonth, today, count: incomes.length };
  }, [incomes]);

  /* categories for filter */
  const categories = useMemo(() => ["all", ...new Set(incomes.map((r) => r.category).filter(Boolean))], [incomes]);

  /* filtered */
  const filtered = useMemo(() => {
    const q   = search.toLowerCase();
    const now = new Date();
    const ago7 = new Date(); ago7.setDate(now.getDate() - 7);

    let r = incomes.filter((inc) => {
      // tab
      if (tab === "recent"  && new Date(inc.date) < ago7)  return false;
      if (tab === "large"   && (inc.amount ?? 0) < 10000)  return false;
      if (tab === "pending" && inc.status !== "pending")    return false;
      // date range
      if (dateRange === "today" && inc.date !== format(now, "yyyy-MM-dd")) return false;
      if (dateRange === "this-week" && new Date(inc.date) < ago7) return false;
      if (dateRange === "this-month") {
        const d = new Date(inc.date);
        if (d < startOfMonth(now) || d > endOfMonth(now)) return false;
      }
      if (dateRange === "last-month") {
        const d = new Date(inc.date);
        const lm = subMonths(now, 1);
        if (d < startOfMonth(lm) || d > endOfMonth(lm)) return false;
      }
      // category
      if (catFilter !== "all" && inc.category !== catFilter) return false;
      // search
      if (q && ![inc.title, inc.customer, inc.source, inc.category, inc.notes].some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });

    r.sort((a, b) => {
      if (sortBy === "date-asc")    return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount-desc") return (b.amount ?? 0) - (a.amount ?? 0);
      if (sortBy === "amount-asc")  return (a.amount ?? 0) - (b.amount ?? 0);
      if (sortBy === "name-asc")    return (a.title ?? "").localeCompare(b.title ?? "");
      return new Date(b.date) - new Date(a.date); // date-desc
    });
    return r;
  }, [incomes, search, tab, sortBy, dateRange, catFilter]);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  useEffect(() => { setPage(1); }, [search, tab, sortBy, dateRange, catFilter]);

  /* selection */
  const toggleSelect    = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(selected.size === pageSlice.length ? new Set() : new Set(pageSlice.map((r) => r.id)));
  const clearSelection  = () => setSelected(new Set());

  /* handlers */
  const handleDeleteConfirm = async () => {
    if (!deleteTgt) return;
    try {
      await deleteIncome(deleteTgt.id);
      setIncomes((prev) => prev.filter((r) => r.id !== deleteTgt.id));
      selected.delete(deleteTgt.id); setSelected(new Set(selected));
      toast.success("Income deleted");
    } catch { toast.error("Delete failed"); }
    finally { setDeleteTgt(null); }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selected) await deleteIncome(id);
      setIncomes((prev) => prev.filter((r) => !selected.has(r.id)));
      toast.success(`Deleted ${selected.size} record${selected.size !== 1 ? "s" : ""}`);
      clearSelection(); setBulkDlg(false);
    } catch { toast.error("Bulk delete failed"); }
  };

  const handleExport = async () => {
    try { await exportIncomesToCSV(); toast.success("Exported"); }
    catch { toast.error("Export failed"); }
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Income</h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.count} records · {INR(stats.total)} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs gap-1.5 border-gray-200">
            <Download className="w-3.5 h-3.5" />Export
          </Button>
          <Link to="/dashboard/income/import">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gray-200">
              <Upload className="w-3.5 h-3.5" />Import
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchIncomes} disabled={loading} className="h-8 text-xs border-gray-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link to="/dashboard/income/add">
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-3.5 h-3.5" />Add Income
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Wallet}      label="Total Income"   value={INR(stats.total)}     accent="emerald" />
        <StatCard icon={CalendarDays} label="This Month"    value={INR(stats.thisMonth)} sub={`vs ${INR(stats.lastMonth)} last month`} accent="sky"    />
        <StatCard icon={Sparkles}    label="Today"          value={INR(stats.today)}     accent="violet"  />
        <StatCard icon={TrendingUp}  label="Transactions"   value={stats.count}          accent="orange"  />
      </div>

      {/* Chart */}
      <IncomeChart incomes={incomes} />

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, customer, source..."
              className="pl-9 h-8 text-sm border-gray-200 bg-gray-50" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-8 text-xs w-[130px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="h-8 text-xs w-[120px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3">
                {categories.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-[130px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3">
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="amount-desc">Highest amount</SelectItem>
                <SelectItem value="amount-asc">Lowest amount</SelectItem>
                <SelectItem value="name-asc">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="h-8 text-xs w-[70px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3">
                {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 -mx-4 px-4 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                ${tab === id ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            {selected.size > 0 && <span className="ml-2 text-emerald-600 font-medium">· {selected.size} selected</span>}
          </p>
          {selected.size > 0 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setBulkDlg(true)} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 bg-red-200 rounded-md px-2 py-1">
                <Trash2 className="w-3 h-3" />Delete selected
              </button>
              <span className="text-gray-300 text-xs">|</span>
              <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-16 text-center">
          <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No income records found</p>
          <p className="text-xs text-gray-400 mb-4">{search ? "Try adjusting your search" : "Add your first income record"}</p>
          {!search && (
            <Link to="/dashboard/income/add">
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-3.5 h-3.5" />Add First Income
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all row */}
          {pageSlice.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                {selected.size > 0 && selected.size === pageSlice.length
                  ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
              </button>
              <span className="text-xs text-gray-400">Select all on page</span>
            </div>
          )}

          {pageSlice.map((income) => {
            const PayIcon = PAY_ICON[income.paymentMethod] ?? Wallet;
            return (
              <div key={income.id}
                className={`group bg-white border rounded-xl px-4 py-3 flex items-center gap-3 transition-all hover:shadow-sm
                  ${selected.has(income.id) ? "border-emerald-300" : "border-gray-100"}`}>
                <button onClick={() => toggleSelect(income.id)} className="shrink-0 text-gray-300 hover:text-gray-500">
                  {selected.has(income.id) ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                </button>

                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <PayIcon className="w-4 h-4 text-emerald-600" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {income.title || "Untitled"}
                    </p>
                    {income.status && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs border ${STATUS_CLS[income.status] ?? STATUS_CLS.received}`}>
                        {income.status}
                      </span>
                    )}
                    {income.category && (
                      <span className="text-xs text-gray-400">{income.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                    {(income.customer || income.source) && (
                      <span>{income.customer || income.source}</span>
                    )}
                    <span>{fmtDate(income.date)}</span>
                    {income.paymentMethod && <span className="capitalize">{income.paymentMethod}</span>}
                  </div>
                </div>

                {/* Amount */}
                <p className="text-base font-bold text-emerald-600 shrink-0 tabular-nums">
                  {INR(income.amount)}
                </p>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all shrink-0">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 text-sm">
                    <DropdownMenuItem onClick={() => navigate(`/dashboard/income/${income.id}/edit`)}>
                      <Edit className="w-3.5 h-3.5 mr-2" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteTgt(income)}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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
              if (totalPages <= 5)          p = i + 1;
              else if (safePage <= 3)       p = i + 1;
              else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
              else                          p = safePage - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${p === safePage ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
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

      {/* Category breakdown */}
      {incomes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* By category */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Category</p>
            <div className="space-y-2">
              {(() => {
                const totals = {};
                incomes.forEach((r) => { const c = r.category || "Other"; totals[c] = (totals[c] || 0) + (r.amount || 0); });
                const total  = Object.values(totals).reduce((a, b) => a + b, 0);
                return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amt]) => {
                  const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{cat}</span>
                        <span className="text-emerald-600 font-semibold">{INR(amt)} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Quick insights */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Insights</p>
            <div className="space-y-2">
              {[
                ["Total Transactions",  stats.count],
                ["Avg. Transaction",    INR(stats.count > 0 ? stats.total / stats.count : 0)],
                ["Largest Income",      INR(Math.max(...incomes.map((r) => r.amount || 0)))],
                ["This vs Last Month",  `${stats.lastMonth > 0 ? ((stats.thisMonth / stats.lastMonth - 1) * 100).toFixed(1) : "—"}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{k}</span>
                  <span className="text-xs font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTgt} onOpenChange={(v) => { if (!v) setDeleteTgt(null); }}>
        <AlertDialogContent className="border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete Income</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Delete <span className="font-medium text-gray-900">{deleteTgt?.title}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDlg} onOpenChange={setBulkDlg}>
        <AlertDialogContent className="border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete {selected.size} Record{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">Delete {selected.size}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}