// DashboardLayout.jsx — light theme
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, Receipt, KeyRound } from "lucide-react";
import NavBar from "@/components/NavBar";

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-14">
        <div className="flex-1">
          <main className="min-h-[calc(100vh-56px)] p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
