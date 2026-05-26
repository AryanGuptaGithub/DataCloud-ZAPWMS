// src/components/Sidebar.jsx — light theme
import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, Receipt, KeyRound } from "lucide-react";

const navItems = [
  { to: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/customers",   label: "Customers",   icon: Users },
  { to: "/income",      label: "Income",      icon: Wallet },
  { to: "/expenses",    label: "Expenses",    icon: Receipt },
  { to: "/credentials", label: "Credentials", icon: KeyRound },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm fixed top-0 left-0 h-full p-4 hidden sm:flex flex-col">
      <div className="mb-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <KeyRound className="w-3.5 h-3.5 text-white" />
        </div>
        <h2 className="text-base font-bold text-gray-900">ZapSolution</h2>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
