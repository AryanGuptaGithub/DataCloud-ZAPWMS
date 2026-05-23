import { Navigate } from "react-router-dom";
import useAuthUser from "@/hooks/useAuthUser";

export default function RootRedirect() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="grid place-items-center min-h-screen text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  // logged in → dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // not logged in → home / login
  return <Navigate to="/home" replace />;
}
