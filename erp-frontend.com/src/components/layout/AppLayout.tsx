import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useMemo } from "react";
import { useAuth } from "@/services/auth/AuthContext";
import { LogOut, User as UserIcon, Mail, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import federationLogo from "@/assets/img/logo-lien-doan-vat-ly-dia-chat.png";
import { ThemeLanguageControls } from "@/components/layout/ThemeLanguageControls";
import { useLocale } from "@/i18n/LocaleContext";
import { appBranding } from "@/components/layout/app-branding";

export function AppLayout() {
  const { t } = useLocale()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <div className="relative flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-header-from to-header-to px-4 text-header-text shadow-sm sm:px-6">
          <div className="flex w-full items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src={federationLogo}
                alt={appBranding.logoAlt}
                className="h-11 w-11 shrink-0 rounded-full bg-header-chip object-contain p-0.5 shadow-sm ring-2 ring-accent sm:h-12 sm:w-12"
              />
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide leading-tight text-header-text">
                  {appBranding.name}
                </h1>
                <p className="text-[11px] font-medium tracking-wide text-header-muted sm:text-xs">
                  {appBranding.subtitle}
                </p>
              </div>
            </div>

            {/* Right User Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeLanguageControls />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* 2. MAIN BODY (Sidebar + Page Content) */}
        <div className="flex-1 flex w-full overflow-hidden">
          <AppSidebar />

          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function UserMenu() {
  const { t } = useLocale()
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Hoàng Minh Admin";
  const email = user?.email || "";
  const initials = useMemo(() => {
    const n = (displayName || "H").trim();
    const parts = n.split(/\s+/);
    return (parts[0]?.[0] || "H").toUpperCase() + (parts[1]?.[0] || "M").toUpperCase();
  }, [displayName]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t("layout.loggedOut"));
      navigate("/auth", { replace: true });
    } catch {
      toast.error(t("layout.logoutFailed"));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-header-chip-border bg-header-chip px-2.5 py-1 text-header-text transition-colors hover:bg-header-chip-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-header-from"
            aria-label={t("layout.account")}
          >
            <Avatar className="h-7 w-7 border border-header-chip-border">
              <AvatarFallback className="bg-accent text-xs font-bold text-primary-dark">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-header-text sm:inline sm:text-sm">
              {displayName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-header-muted" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-semibold">{displayName}</span>
            {email ? (
              <span className="text-xs text-muted-foreground">{email}</span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenProfile(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            {t("layout.profile")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            {t("layout.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Popup chi tiết tài khoản */}
      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("layout.profile")}</DialogTitle>
            <DialogDescription>{t("layout.profileHint")}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-accent">
              <AvatarFallback className="bg-accent text-base font-bold text-primary-dark">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="text-base font-semibold">{displayName}</div>
              {email ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  {email}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenProfile(false)}>{t("common.close")}</Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("layout.logout")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
