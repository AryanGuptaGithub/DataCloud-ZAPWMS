// src/pages/Auth/Register.jsx
import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, User, RefreshCw, ArrowRight, KeyRound } from "lucide-react";

/* ── password strength ───────────────────── */
function pwdStrength(pwd) {
  if (!pwd) return { score: 0, label: "", bar: "" };
  let s = 0;
  if (pwd.length >= 8)            s++;
  if (pwd.length >= 12)           s++;
  if (/[A-Z]/.test(pwd))         s++;
  if (/[0-9]/.test(pwd))         s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  const map = [
    { label: "Very weak",   bar: "bg-red-500"     },
    { label: "Weak",        bar: "bg-orange-500"  },
    { label: "Fair",        bar: "bg-yellow-500"  },
    { label: "Good",        bar: "bg-blue-500"    },
    { label: "Strong",      bar: "bg-emerald-500" },
    { label: "Very strong", bar: "bg-emerald-600" },
  ];
  return { score: s, ...map[s] };
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const pwd = useMemo(() => pwdStrength(form.password), [form.password]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                       e.name            = "Full name is required";
    if (!form.email.trim())                      e.email           = "Email is required";
    if (!form.password)                          e.password        = "Password is required";
    if (form.password && form.password.length < 8) e.password      = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)  e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      });
      localStorage.setItem("token", data.token);
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* ── Left branding panel ── */}
      <div className="hidden md:flex w-1/2 bg-gray-950 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Get started free</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Join ZapDataCloud and take control of your business data in minutes.
          </p>

          <div className="mt-10 space-y-3 text-left">
            {[
              "No credit card required",
              "Set up in under 2 minutes",
              "All your data, fully private",
              "Works on mobile & desktop",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-gray-400">{item}</span>
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

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Fill in the details below to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className={`pl-9 h-10 text-sm ${errors.name ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

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
                  className={`pl-9 h-10 text-sm ${errors.email ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className={`pl-9 pr-9 h-10 text-sm ${errors.password ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 dark:border-gray-700"}`}
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
              {/* Strength meter */}
              {form.password && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-0.5">
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < pwd.score ? pwd.bar : "bg-gray-200 dark:bg-gray-700"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{pwd.label}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className={`pl-9 h-10 text-sm ${errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              {/* Match indicator */}
              {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-emerald-600 font-medium">Passwords match ✓</p>
              )}
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-10 text-sm font-semibold gap-2 bg-violet-600 hover:bg-violet-700 text-white mt-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Creating account...</>
                : <><ArrowRight className="w-4 h-4" />Create account</>
              }
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}