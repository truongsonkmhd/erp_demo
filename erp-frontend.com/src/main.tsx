import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/services/auth/AuthContext";
import { LocaleProvider } from "@/i18n/LocaleContext";
import "@/config/firebaseConnect";
import App from "./routers/App";
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="hoangminh_theme" enableSystem={false}>
      <LocaleProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  </BrowserRouter>
);
