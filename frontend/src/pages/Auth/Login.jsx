// src/pages/Auth/Login.jsx — light theme
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, RefreshCw, ArrowRight, KeyRound, BarChart3, Users, Wallet, Shield } from "lucide-react";

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Left branding panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6 border border-white/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">ZapDataCloud</h1>
          <p className="text-violet-200 text-sm leading-relaxed">
            Manage your clients, credentials, income, and expenses — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[
              [BarChart3, "Analytics",    "Real-time insights"],
              [Users,     "Clients",      "Track every client"],
              [Wallet,    "Finances",     "Income & expenses"],
              [Shield,    "Credentials", "Secure & expiry alerts"],
            ].map(([Icon, title, desc]) => (
              <div key={title} className="p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-violet-200" />
                  <p className="text-xs font-semibold text-white">{title}</p>
                </div>
                <p className="text-xs text-violet-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo on mobile */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ZapDataCloud</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8">
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
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
                  className={`pl-9 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white ${errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Password
                </Label>
                <Link to="/forgotpassword" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
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
                  className={`pl-9 pr-9 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white ${errors.password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-violet-600 hover:text-violet-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
