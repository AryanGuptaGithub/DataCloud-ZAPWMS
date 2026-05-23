// src/pages/Dashboard/DashboardHome.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users, DollarSign, TrendingUp, TrendingDown, Calendar,
  Shield, RefreshCw, ArrowUpRight, ArrowDownRight,
  Plus, AlertCircle, CheckCircle2, Clock, Target,
  Wallet, Receipt, KeyRound, BarChart3, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  format, startOfMonth, endOfMonth,
  subMonths, eachMonthOfInterval, isValid,
} from "date-fns";
import api from "@/lib/axios";

/* ── helpers ─────────────────────────────── */
const INR = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  return isValid(d) ? format(d, "dd MMM") : "—";
};

const pctChange = (curr, prev) => {
  if (!prev) return null;
  const pct = ((curr - prev) / prev) * 100;
  return { value: Math.abs(pct).toFixed(1), up: pct >= 0 };
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

/* ── stat card ───────────────────────────── */
function StatCard({ icon: Icon, label, value, change, accent, to }) {
  const colors = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    red:     "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
    sky:     "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",
    violet:  "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
  };
  const inner = (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-all group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colors[accent] ?? colors.sky}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${change.up ? "text-emerald-600" : "text-red-500"}`}>
            {change.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change.value}% vs last month
          </div>
        )}
      </div>
      {to && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

/* ── section header ──────────────────────── */
function SectionHead({ title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── custom tooltip ──────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {INR(p.value)}</p>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function DashboardHome() {
  const [incomes,  setIncomes]  = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [iRes, eRes, cRes] = await Promise.all([
        api.get("/incomes"),
        api.get("/expenses"),
        api.get("/clients"),
      ]);
      setIncomes(iRes.data);
      setExpenses(eRes.data);
      setClients(cRes.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  /* ── computed stats ── */
  const stats = useMemo(() => {
    const now    = new Date();
    const mStart = startOfMonth(now);
    const mEnd   = endOfMonth(now);
    const lStart = startOfMonth(subMonths(now, 1));
    const lEnd   = endOfMonth(subMonths(now, 1));

    const sum = (arr, from, to) =>
      arr.filter((r) => { const d = new Date(r.date || r.created_at); return d >= from && d <= to; })
         .reduce((s, r) => s + (r.amount || 0), 0);

    const totalIncome   = incomes.reduce((s, r)  => s + (r.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, r) => s + (r.amount || 0), 0);
    const thisIncome    = sum(incomes,  mStart, mEnd);
    const lastIncome    = sum(incomes,  lStart, lEnd);
    const thisExpense   = sum(expenses, mStart, mEnd);
    const lastExpense   = sum(expenses, lStart, lEnd);

    return {
      totalIncome, totalExpenses,
      netProfit: totalIncome - totalExpenses,
      clients: clients.length,
      thisIncome, lastIncome,
      thisExpense, lastExpense,
      incomeChange:   pctChange(thisIncome,   lastIncome),
      expenseChange:  pctChange(thisExpense,  lastExpense),
      pendingIncome:  incomes.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amount || 0), 0),
    };
  }, [incomes, expenses, clients]);

  /* ── monthly trend chart data ── */
  const trendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end:   new Date(),
    });
    return months.map((month) => {
      const s = startOfMonth(month);
      const e = endOfMonth(month);
      const inc = incomes.filter((r) => { const d = new Date(r.date); return d >= s && d <= e; })
                         .reduce((sum, r) => sum + (r.amount || 0), 0);
      const exp = expenses.filter((r) => { const d = new Date(r.date); return d >= s && d <= e; })
                          .reduce((sum, r) => sum + (r.amount || 0), 0);
      return { name: format(month, "MMM"), income: Math.round(inc), expense: Math.round(exp) };
    });
  }, [incomes, expenses]);

  /* ── expense by category ── */
  const expCat = useMemo(() => {
    const map = {};
    expenses.forEach((r) => { const c = r.category || "Other"; map[c] = (map[c] || 0) + (r.amount || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);

  /* ── recent items ── */
  const recentIncomes  = useMemo(() =>
    [...incomes].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)).slice(0, 5),
    [incomes]
  );
  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)).slice(0, 5),
    [expenses]
  );

  /* ── render ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}
          className="h-8 text-xs gap-1.5 border-gray-200 dark:border-gray-700">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp}   label="Total Income"   value={INR(stats.totalIncome)}   change={stats.incomeChange}  accent="emerald" to="/dashboard/income"    />
        <StatCard icon={TrendingDown} label="Total Expenses" value={INR(stats.totalExpenses)} change={stats.expenseChange} accent="red"     to="/dashboard/expenses"  />
        <StatCard icon={Wallet}       label="Net Profit"     value={INR(stats.netProfit)}     accent="sky"                                   />
        <StatCard icon={Users}        label="Clients"        value={stats.clients}            accent="violet"              to="/dashboard/customers" />
      </div>

      {/* ── This month strip ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Income this month",   value: INR(stats.thisIncome),  color: "text-emerald-600" },
          { label: "Expenses this month", value: INR(stats.thisExpense), color: "text-red-500"     },
          { label: "Profit this month",   value: INR(stats.thisIncome - stats.thisExpense), color: stats.thisIncome >= stats.thisExpense ? "text-emerald-600" : "text-red-500" },
          { label: "Pending income",      value: INR(stats.pendingIncome), color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-base font-bold tabular-nums mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart — takes 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <SectionHead title="Income vs Expenses" sub="Last 6 months" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#F3F4F6" }} />
                <Area type="monotone" dataKey="income"  name="Income"   stroke="#10b981" strokeWidth={2} fill="url(#incGrad)" />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* legend */}
          <div className="flex items-center gap-4 mt-2">
            {[["#10b981","Income"],["#ef4444","Expenses"]].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <SectionHead title="Expenses by Category" sub="All time" />
          {expCat.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expCat} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" paddingAngle={3}>
                      {expCat.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => INR(v)} contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {expCat.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate max-w-[90px]">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{INR(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <Receipt className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No expense data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent transactions + quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent income */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <SectionHead
            title="Recent Income"
            action={
              <Link to="/dashboard/income"
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            }
          />
          {recentIncomes.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {recentIncomes.map((inc, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                      {inc.title || "Income"}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(inc.date)}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 tabular-nums ml-3 shrink-0">
                    {INR(inc.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">No income yet</p>
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <SectionHead
            title="Recent Expenses"
            action={
              <Link to="/dashboard/expenses"
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            }
          />
          {recentExpenses.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {recentExpenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                      {exp.title || "Expense"}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(exp.date)}</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 tabular-nums ml-3 shrink-0">
                    {INR(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">No expenses yet</p>
            </div>
          )}
        </div>

        {/* Right column: quick actions + summary */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <SectionHead title="Quick Actions" />
            <div className="space-y-2">
              {[
                { to: "/dashboard/income/add",   icon: TrendingUp,   label: "Add Income",     cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
                { to: "/dashboard/expenses/add", icon: TrendingDown, label: "Add Expense",     cls: "text-red-500 bg-red-50 dark:bg-red-950/40"             },
                { to: "/dashboard/clients/new",  icon: Users,        label: "Add Client",      cls: "text-sky-600 bg-sky-50 dark:bg-sky-950/40"             },
                { to: "/dashboard/credentials",  icon: KeyRound,     label: "Add Credential",  cls: "text-violet-600 bg-violet-50 dark:bg-violet-950/40"    },
              ].map(({ to, icon: Icon, label, cls }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Summary strip */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <SectionHead title="At a Glance" />
            <div className="space-y-2">
              {[
                ["Total transactions", incomes.length + expenses.length],
                ["Avg. income",        INR(incomes.length ? stats.totalIncome / incomes.length : 0)],
                ["Avg. expense",       INR(expenses.length ? stats.totalExpenses / expenses.length : 0)],
                ["Profit margin",      stats.totalIncome > 0 ? `${((stats.netProfit / stats.totalIncome) * 100).toFixed(1)}%` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <span className="text-xs text-gray-500">{k}</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}