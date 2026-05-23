// src/pages/UserProfile.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Button }   from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/axios";
import {
  User, Mail, Phone, Building2, MapPin, Lock,
  Save, RefreshCw, Eye, EyeOff, LogOut, Calendar,
  ShieldCheck, CheckCircle,
} from "lucide-react";
import { format, isValid } from "date-fns";

/* ── helpers ─────────────────────────────── */
function initials(name) {
  if (!name) return "U";
  const p = name.trim().split(" ");
  return p.length >= 2
    ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
    : p[0][0].toUpperCase();
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}

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

/* ── tab config ──────────────────────────── */
const TABS = [
  { id: "profile",  label: "Profile",  icon: User    },
  { id: "security", label: "Security", icon: Lock    },
];

/* ════════════════════════════════════════════
   PROFILE TAB
════════════════════════════════════════════ */
function ProfileTab({ user, onSaved }) {
  const [form, setForm]     = useState({ name: "", phone: "", company: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  // Populate form from user
  useEffect(() => {
    if (user) {
      setForm({
        name:     user.name     ?? "",
        phone:    user.phone    ?? "",
        company:  user.company  ?? "",
        location: user.location ?? "",
      });
      setDirty(false);
    }
  }, [user]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { data } = await api.put("/auth/update-profile", form);
      onSaved(data);
      setDirty(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "name",     label: "Full Name",  icon: User,      type: "text",  placeholder: "John Doe",          required: true  },
    { key: "phone",    label: "Phone",      icon: Phone,     type: "tel",   placeholder: "+91 98765 43210",    required: false },
    { key: "company",  label: "Company",    icon: Building2, type: "text",  placeholder: "Acme Corp",          required: false },
    { key: "location", label: "Location",   icon: MapPin,    type: "text",  placeholder: "Mumbai, India",      required: false },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Email — read only */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />Email
        </Label>
        <div className="flex items-center h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
          {user?.email}
        </div>
        <p className="text-xs text-gray-400">Email cannot be changed</p>
      </div>

      <Separator className="bg-gray-100 dark:bg-gray-800" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, icon: Icon, type, placeholder, required }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {label}{required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              type={type}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className="h-9 text-sm border-gray-200 dark:border-gray-700"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={saving || !dirty}
          size="sm"
          className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white disabled:opacity-40"
        >
          {saving
            ? <><RefreshCw className="w-3 h-3 animate-spin" />Saving...</>
            : <><Save className="w-3 h-3" />Save Changes</>
          }
        </Button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════
   SECURITY TAB
════════════════════════════════════════════ */
function SecurityTab() {
  const [form, setForm]   = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow]   = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleShow = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) { toast.error("Enter your current password"); return; }
    if (form.newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (form.newPassword === form.currentPassword) { toast.error("New password must differ from current"); return; }

    setSaving(true);
    setSuccess(false);
    try {
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const pwd  = pwdStrength(form.newPassword);
  const PwdField = ({ fieldKey, label, showKey }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</Label>
      <div className="relative">
        <Input
          type={show[showKey] ? "text" : "password"}
          value={form[fieldKey]}
          onChange={(e) => set(fieldKey, e.target.value)}
          placeholder="••••••••••••"
          className="h-9 text-sm pr-9 border-gray-200 dark:border-gray-700"
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Password updated successfully</p>
        </div>
      )}

      <PwdField fieldKey="currentPassword" label="Current Password" showKey="current" />
      
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Password</Label>
        <div className="relative">
          <Input
            type={show.new ? "text" : "password"}
            value={form.newPassword}
            onChange={(e) => set("newPassword", e.target.value)}
            placeholder="••••••••••••"
            className="h-9 text-sm pr-9 border-gray-200 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={() => toggleShow("new")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.newPassword && (
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

      <PwdField fieldKey="confirmPassword" label="Confirm New Password" showKey="confirm" />

      {form.confirmPassword && form.newPassword !== form.confirmPassword && (
        <p className="text-xs text-red-500">Passwords don't match</p>
      )}

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={saving}
          size="sm"
          className="h-8 text-xs gap-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white"
        >
          {saving
            ? <><RefreshCw className="w-3 h-3 animate-spin" />Updating...</>
            : <><ShieldCheck className="w-3 h-3" />Update Password</>
          }
        </Button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function UserProfile() {
  const navigate = useNavigate();
  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("profile");
  const [logoutOpen,  setLogoutOpen]  = useState(false);

  /* fetch user */
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      toast.error("Failed to load profile");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* loading skeleton */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage your account details</p>
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>

        {/* ── Identity card ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarImage src={user?.avatar || ""} alt={user?.name} />
              <AvatarFallback className="text-lg font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || "No name set"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {user?.company && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Building2 className="w-3 h-3" />{user.company}
                  </span>
                )}
                {user?.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />{user.location}
                  </span>
                )}
                {user?.createdAt && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />Joined {fmtDate(user.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                  ${tab === id
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {tab === "profile"  && <ProfileTab  user={user} onSaved={setUser} />}
            {tab === "security" && <SecurityTab />}
          </div>
        </div>

      </div>

      {/* Logout confirmation */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Log out?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs border-gray-200 dark:border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}