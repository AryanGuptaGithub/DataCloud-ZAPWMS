// App.jsx
import { BrowserRouter } from "react-router-dom";
import Router from "@/router/Router";
import NavBar from "@/components/NavBar";
import { Toaster } from "sonner";
import { LoadingProvider } from "@/components/LoadingProvider";
import Snowfall from "react-snowfall";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <LoadingProvider>
          <Toaster duration={1000} richColors position="top-right" />

          <div className=" bg-slate-500 min-h-screen">
            {/* <Snowfall /> */}
            <Router />
          </div>
        </LoadingProvider>
      </BrowserRouter>
    </>
  );
}
