import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { firstAllowedPath } from "@/lib/permissions";
import { ApiError, isSystemError } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { appToast } from "@/components/ui/app-toast";
import { useLocale } from "@/i18n/LocaleContext";
import bgLogin from "@/assets/img/background-geophysical-survey.webp";
import federationLogo from "@/assets/img/logo-lien-doan-vat-ly-dia-chat.png";

function resolveAuthError(err: unknown, t: (key: string) => string) {
  if (isSystemError(err)) {
    return {
      inline: t("auth.systemError"),
      toastTitle: t("auth.errorTitle"),
      toastDescription: t("auth.systemError"),
    }
  }

  const raw =
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : undefined
  const inline = mapAuthErrorMessage(raw, t)

  return {
    inline,
    toastTitle: t("auth.errorTitle"),
    toastDescription: inline,
  }
}

function mapAuthErrorMessage(raw: string | undefined, t: (key: string) => string): string {
  const message = (raw || "").trim().toLowerCase();
  if (!message || message.includes("invalid credentials")) {
    return t("auth.invalidCredentials");
  }
  if (message.includes("inactive")) {
    return t("auth.inactiveUser");
  }
  if (message.includes("required") || message.includes("email and password")) {
    return t("auth.requiredFields");
  }
  if (message.includes("đăng nhập thất bại") || message.includes("sign in failed")) {
    return t("auth.invalidCredentials");
  }
  return raw?.trim() || t("auth.genericError");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || /^[^\s@]+@[^\s@]+$/.test(value.trim());
}

export default function AuthScreen() {
  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-primary bg-cover bg-center px-4 py-8 sm:px-6"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      <div className="absolute inset-0 bg-foreground/60" aria-hidden="true" />

      <section className="relative z-10 w-full max-w-md" aria-labelledby="login-heading">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          <div className="mb-7 text-center">
            <img
              src={federationLogo}
              alt="Logo Liên đoàn Vật lý Địa chất"
              className="mx-auto mb-4 h-20 w-20 object-contain"
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cục Địa chất và Khoáng sản Việt Nam
            </p>
            <p className="mt-1 text-base font-semibold text-card-foreground">
              Liên đoàn Vật lý Địa chất
            </p>
            <h1 id="login-heading" className="mt-5 text-3xl font-semibold tracking-tight text-card-foreground">
              Đăng nhập hệ thống
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sử dụng tài khoản được cấp để tiếp tục.
            </p>
          </div>

          <SignIn />
        </div>
      </section>
    </main>
  );
}

function SignIn() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { signIn } = useAuth();
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem('auth_email') || '' : '';

  return (
    <motion.form
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="space-y-5"
      aria-describedby={error ? "auth-error" : undefined}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") || "").trim();
        const password = String(fd.get("password") || "");

        if (!email || !password) {
          const errMsg = t("auth.requiredFields");
          setError(errMsg);
          appToast.error(t("auth.errorTitle"), errMsg);
          return;
        }

        if (!isValidEmail(email)) {
          const errMsg = t("auth.invalidEmail");
          setError(errMsg);
          appToast.error(t("auth.errorTitle"), errMsg);
          return;
        }

        setIsLoading(true);
        try {
          const user = await signIn(email, password, remember);
          appToast.success(t("auth.successTitle"), t("auth.successHint"));
          setTimeout(() => {
            navigate(firstAllowedPath(user), { replace: true });
          }, 400);
        } catch (err: unknown) {
          const { inline, toastTitle, toastDescription } = resolveAuthError(err, t);
          setError(inline);
          appToast.error(toastTitle, toastDescription);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {error && (
        <div
          id="auth-error"
          role="alert"
          className="rounded-lg border border-toast-error-border bg-toast-error-background px-4 py-3 text-sm text-toast-error-foreground"
        >
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="si-email" className="text-sm font-medium">{t("auth.emailLabel")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="si-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={rememberedEmail}
            placeholder={t("auth.emailPlaceholder")}
            className="h-11 pl-11 text-base"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "auth-error" : undefined}
            disabled={isLoading}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="si-pass" className="text-sm font-medium">{t("auth.passwordLabel")}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input 
            id="si-pass" 
            name="password" 
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 pl-11 pr-12 text-base"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "auth-error" : undefined}
            disabled={isLoading}
            required 
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={showPassword}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <label className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm text-muted-foreground">
        <Checkbox
          checked={remember}
          onCheckedChange={(v) => setRemember(Boolean(v))}
          disabled={isLoading}
          className="h-5 w-5"
        />
        <span>{t("auth.rememberMe")}</span>
      </label>

      <Button 
        disabled={isLoading} 
        className="h-11 w-full text-base"
        type="submit"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span>{t("auth.submitting")}</span>
          </>
        ) : (
          t("auth.submit")
        )}
      </Button>
    </motion.form>
  );
}

