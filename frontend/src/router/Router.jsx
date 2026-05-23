// src/router/Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";

import DashboardLayout    from "@/components/layout/DashboardLayout.jsx";
import DashboardHome      from "@/pages/Dashboard/DashboardHome.jsx";
import CustomersPage      from "@/pages/Customers.jsx";
import CredentialsPage    from "@/pages/CredentialsPage.jsx";
import AddCredentialPage  from "@/pages/Credentials/AddCredentialPage.jsx";
import IncomePage         from "@/pages/Income.jsx";
import ExpensePage        from "@/pages/Expense.jsx";
import UserProfile        from "@/pages/UserProfile";
import ClientManagement   from "@/pages/Clients/ClientManagement";
import ImportClients      from "@/pages/Clients/ImportClients";
import AddIncome          from "@/pages/Income/AddIncome";
import EditIncome         from "@/pages/Income/EditIncome";
import ImportExpense      from "@/pages/Expense/ImportExpense";
import AddExpense         from "@/pages/Expense/AddExpense";
import EditExpense        from "@/pages/Expense/EditExpense";
import ImportIncome       from "@/pages/Income/ImportIncome";

import Login          from "@/pages/Auth/Login.jsx";
import Register       from "@/pages/Auth/Register.jsx";
import ForgotPassword from "@/pages/Auth/ForgotPassword.jsx";
import Home           from "@/pages/Home.jsx";
import RootRedirect   from "@/pages/RootRedirect.jsx";

export default function Router() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/home"           element={<Home />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="profile"    element={<UserProfile />} />
        <Route path="customers"  element={<CustomersPage />} />

        {/* Credentials — list + add page */}
        <Route path="credentials"      element={<CredentialsPage />} />
        <Route path="credentials/add"  element={<AddCredentialPage />} />

        {/* Income */}
        <Route path="income"              element={<IncomePage />} />
        <Route path="income/import"       element={<ImportIncome />} />
        <Route path="income/add"          element={<AddIncome />} />
        <Route path="income/:id/edit"     element={<EditIncome />} />

        {/* Expenses */}
        <Route path="expenses"            element={<ExpensePage />} />
        <Route path="expenses/import"     element={<ImportExpense />} />
        <Route path="expenses/add"        element={<AddExpense />} />
        <Route path="expenses/:id/edit"   element={<EditExpense />} />

        {/* Clients */}
        <Route path="clients/new"         element={<ClientManagement />} />
        <Route path="clients/:id/edit"    element={<ClientManagement />} />
        <Route path="clients/import"      element={<ImportClients />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}