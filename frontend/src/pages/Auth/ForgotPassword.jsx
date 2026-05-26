// src/pages/Auth/ForgotPassword.jsx — light theme
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send reset email");
      toast.success(data.message || "Reset link sent!");
      setEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6 border border-white/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Reset Password</h1>
          <p className="text-violet-200 text-sm leading-relaxed">
            Enter your email and we'll send you a secure reset link right away.
          </p>
        </div>
      </div>

      {/* Reset form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ZapDataCloud</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h2>
          <p className="text-sm text-gray-500 mb-8">
            Enter your registered email to receive a reset link
          </p>

          <form onSubmit={onResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email" name="email" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-9 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:ring-violet-500"
                  required
                />
              </div>
            </div>

            <Button type="submit"
              className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 mt-6 gap-2">
            <Link to="/login" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />Back to Login
            </Link>
            <Link to="/register" className="text-violet-600 hover:text-violet-700 font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
