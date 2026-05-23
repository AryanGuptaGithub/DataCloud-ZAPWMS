// src/components/NavBar.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Wallet, Receipt, KeyRound,
  LogIn, UserPlus, LogOut, User, Sun, Moon, Menu, X, ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthUser from "@/hooks/useAuthUser";

/* ── nav items ─────────────────────────────── */
const NAV = [
  { to: "/dashboard",             label: "Dashboard",   icon: LayoutDashboard, end: true },
  { to: "/dashboard/customers",   label: "Clients",     icon: Users },
  { to: "/dashboard/income",      label: "Income",      icon: Wallet },
  { to: "/dashboard/expenses",    label: "Expenses",    icon: Receipt },
  { to: "/dashboard/credentials", label: "Credentials", icon: KeyRound },
];

/* ── dark mode hook ────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
}

/* ── initials helper ───────────────────────── */
function initials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
}

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
export default function NavBar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, loading } = useAuthUser();
  const [dark, toggleDark] = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* close drawer on route change */
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const isOnDashboard = location.pathname.startsWith("/dashboard");

  /* ── active link styles ── */
  const linkCls = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
    ${isActive
      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <>
      {/* ── Main bar ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between gap-4">

          {/* Left — logo + hamburger */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <button
              onClick={() => navigate("/home")}
              className="text-sm font-bold text-gray-900 dark:text-white tracking-tight hover:opacity-80 transition-opacity"
            >
              ZapDataCloud
            </button>
          </div>

          {/* Center — desktop nav (only on dashboard, only when logged in) */}
          {user && isOnDashboard && (
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={linkCls}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right — dark toggle + auth */}
          <div className="flex items-center gap-1.5">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Not logged in */}
            {!loading && !user && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-md transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Logged in — avatar dropdown */}
            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  {/* User info */}
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />

                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                    className="gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-sm cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200
          ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
          flex flex-col transition-transform duration-200 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <span className="text-sm font-bold text-gray-900 dark:text-white">ZapDataCloud</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {user && isOnDashboard && NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Not logged in links */}
          {!user && !loading && (
            <div className="space-y-1.5 pt-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />Log in
              </button>
              <button
                onClick={() => navigate("/register")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="w-4 h-4" />Sign up
              </button>
            </div>
          )}
        </nav>

        {/* Drawer footer — user info + logout */}
        {user && (
          <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Avatar className="w-8 h-8 shrink-0 border-2">
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { navigate("/dashboard/profile"); setDrawerOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <User className="w-4 h-4" />Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}