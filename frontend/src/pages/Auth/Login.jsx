// src/pages/Auth/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, RefreshCw, ArrowRight, KeyRound } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form,      setForm]      = useState({ email: "", password: "" });
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = "Email is required";
    if (!form.password)        e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email:    form.email.trim(),
        password: form.password,
      });
      localStorage.setItem("token", data.token);
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Invalid email or password";
      toast.error(msg);
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* ── Left branding panel ── */}
      <div className="hidden md:flex w-1/2 bg-gray-950 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* grid texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        {/* glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">ZapDataCloud</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Manage your clients, credentials, income, and expenses — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[
              ["Clients",      "Track every client"],
              ["Credentials",  "Secure & expiry alerts"],
              ["Income",       "Record payments"],
              ["Expenses",     "Monitor spending"],
            ].map(([title, desc]) => (
              <div key={title} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">

          {/* Logo on mobile */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">ZapDataCloud</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={`pl-9 h-10 text-sm  ${errors.email ?  " border-red-400 focus-visible:ring-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </Label>
                <Link to="/forgotpassword" className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className={`pl-9 pr-9  h-10 text-sm ${errors.password ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-10 text-sm font-semibold gap-2 bg-violet-600 hover:bg-violet-700 text-white mt-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Signing in...</>
                : <><ArrowRight className="w-4 h-4" />Sign in</>
              }
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}