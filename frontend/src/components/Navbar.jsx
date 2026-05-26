// src/components/NavBar.jsx  — light theme only
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Wallet, Receipt, KeyRound,
  LogIn, UserPlus, LogOut, User, Menu, X, ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthUser from "@/hooks/useAuthUser";


const NAV = [
  { to: "/dashboard",             label: "Dashboard",   icon: LayoutDashboard, end: true },
  { to: "/dashboard/customers",   label: "Clients",     icon: Users },
  { to: "/dashboard/income",      label: "Income",      icon: Wallet },
  { to: "/dashboard/expenses",    label: "Expenses",    icon: Receipt },
  { to: "/dashboard/credentials", label: "Credentials", icon: KeyRound },
];

function initials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
}

export default function NavBar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, loading } = useAuthUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Force light mode always
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const isOnDashboard = location.pathname.startsWith("/dashboard");

  const linkCls = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
    ${isActive
      ? "bg-violet-600 text-white shadow-sm"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <>
      {/* Main bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between gap-4">

          {/* Left — logo + hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity "
            >
                <img
     src="/datacloud.png"
    alt="ZapDataCloud Logo"
    className="w-15 h-15 rounded-lg object-cover"
  />

            </button>
          </div>

          {/* Center — desktop nav */}
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

          {/* Right — auth */}
          <div className="flex items-center gap-1.5">
            {!loading && !user && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-3 py-1.5 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 rounded-md transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}

            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors outline-none">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback className="text-xs font-semibold bg-violet-100 text-violet-700">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 shadow-lg">
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                    className="gap-2 text-sm cursor-pointer text-gray-700 focus:bg-gray-100"
                  >
                    <User className="w-4 h-4" />Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-sm cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-200
          ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-xl
          flex flex-col transition-transform duration-200 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <KeyRound className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">ZapDataCloud</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {user && isOnDashboard && NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          {!user && !loading && (
            <div className="space-y-1.5 pt-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />Log in
              </button>
              <button
                onClick={() => navigate("/register")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />Sign up
              </button>
            </div>
          )}
        </nav>

        {user && (
          <div className="shrink-0 border-t border-gray-200 p-3 space-y-1 bg-gray-50">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback className="text-xs font-semibold bg-violet-100 text-violet-700">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { navigate("/dashboard/profile"); setDrawerOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
            >
              <User className="w-4 h-4" />Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
