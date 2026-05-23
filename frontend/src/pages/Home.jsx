// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import useAuthUser from "@/hooks/useAuthUser";
import {
  Users, KeyRound, Wallet, Receipt,
  ArrowRight, Shield, BarChart2, Clock,
  ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Client Management",
    desc: "Keep track of all your clients with full contact history, follow-up reminders, and communication logs.",
  },
  {
    icon: Wallet,
    title: "Income & Expenses",
    desc: "Monitor your cash flow, categorise transactions, and get instant insights on your business finances.",
  },
  {
    icon: KeyRound,
    title: "Secure Credentials",
    desc: "Store domain and hosting credentials per client with expiry alerts and one-click portal access.",
  },
];

const TESTIMONIALS = [
  { name: "Alice Johnson", text: "ZapDataCloud helped us organize everything. Managing clients and finances is effortless now." },
  { name: "Michael Smith", text: "The dashboard is clean and focused. I love tracking income and expenses all in one place." },
  { name: "Sarah Lee",     text: "Storing credentials with expiry alerts is a lifesaver for our small team." },
];

const WHY = [
  { icon: Shield,   title: "Secure by default",  desc: "JWT-protected data, per-user isolation" },
  { icon: BarChart2, title: "Instant insights",  desc: "Charts and stats update in real time"   },
  { icon: Clock,    title: "Renewal alerts",      desc: "Never miss a domain or hosting renewal" },
];

export default function Home() {
  const navigate      = useNavigate();
  const { user, loading } = useAuthUser();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-950 dark:bg-gray-950 text-white relative overflow-hidden">
        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All-in-one business dashboard
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Manage your business<br />
            <span className="text-emerald-400">without the chaos</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Clients, credentials, income, and expenses — everything in one clean dashboard built for freelancers and agencies.
          </p>

          {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <>
                  <button onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500">Welcome back, {user.name?.split(" ")[0] ?? "there"} 👋</p>
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/register")}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/login")}
                    className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                    Log in
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              Four core modules, zero clutter. Built for small teams that want clarity.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Why ZapDataCloud?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                We built this because other tools were either too complex or too shallow. This is the middle ground — powerful enough for agencies, simple enough for freelancers.
              </p>
              {!loading && !user && (
                <button onClick={() => navigate("/register")}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                  Start for free <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {!loading && user && (
                <button onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                  Open dashboard <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              {WHY.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What users say</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, text }) => (
              <div key={name} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">"{text}"</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">— {name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-gray-950 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {user ? "Ready to get back to work?" : "Ready to get started?"}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {user
              ? "Your dashboard is waiting."
              : "Sign up in seconds. No credit card required."}
          </p>
          {!loading && (
            user ? (
              <button onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors">
                Sign up free <ArrowRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-gray-950 border-t border-white/5 text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} ZapDataCloud. All rights reserved.
          {user && <span className="ml-3 text-gray-700">Logged in as {user.email}</span>}
        </p>
      </footer>
    </div>
  );
}