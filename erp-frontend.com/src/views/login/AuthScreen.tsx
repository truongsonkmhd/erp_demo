import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Loader2, Eye, EyeOff, User, Phone, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { firstAllowedPath } from "@/lib/permissions";
import { ApiError, isSystemError } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { getRegistrationUnits, registerAccount, RegistrationUnit } from "@/services/auth/AuthService";
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
  if (message.includes("pending approval")) {
    return t("auth.pendingApproval");
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

export default function AuthScreen({ mode = "signin" }: { mode?: "signin" | "register" }) {
  const isRegister = mode === "register";
  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-primary bg-cover bg-center px-4 py-8 sm:px-6"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      <div className="absolute inset-0 bg-foreground/60" aria-hidden="true" />

      <section className={`relative z-10 w-full ${isRegister ? "max-w-lg" : "max-w-md"}`} aria-labelledby="login-heading">
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
              {isRegister ? "Đăng ký tài khoản" : "Đăng nhập hệ thống"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isRegister
                ? "Tài khoản mới cần quản trị viên duyệt và phân quyền trước khi đăng nhập."
                : "Sử dụng tài khoản được cấp để tiếp tục."}
            </p>
          </div>

          {isRegister ? <Register /> : <SignIn />}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
            <Link
              to={isRegister ? "/auth" : "/register"}
              className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isRegister ? "Đăng nhập" : "Đăng ký"}
            </Link>
          </p>
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


function mapRegisterError(err: unknown): string {
  if (isSystemError(err)) return "Thông báo lỗi hệ thống";
  const raw = (err instanceof Error ? err.message : "").trim();
  const message = raw.toLowerCase();
  if (message.includes("email already exists")) return "Email này đã được đăng ký.";
  if (message.includes("password must")) return "Mật khẩu cần 8–100 ký tự, gồm cả chữ và số.";
  if (message.includes("department not found")) return "Đơn vị đã chọn không còn tồn tại, vui lòng chọn lại.";
  return raw || "Không thể đăng ký. Vui lòng thử lại.";
}

function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 100 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

function Register() {
  const reduceMotion = useReducedMotion();
  const [units, setUnits] = useState<RegistrationUnit[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // The unit list is only a hint for the approving admin; the form still works without it.
    void getRegistrationUnits()
      .then((items) => {
        if (active) setUnits(items || []);
      })
      .catch(() => {
        if (active) setUnits([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (registeredEmail) {
    return (
      <div role="status" className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <p className="text-base font-semibold text-card-foreground">Đã gửi đăng ký</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Tài khoản <span className="font-medium text-card-foreground">{registeredEmail}</span> đang chờ quản trị viên duyệt.
          Bạn có thể đăng nhập sau khi tài khoản được duyệt và phân quyền.
        </p>
        <Button asChild className="h-11 w-full text-base">
          <Link to="/auth">Về trang đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.form
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="space-y-4"
      aria-describedby={error ? "register-error" : undefined}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const fullName = String(fd.get("fullName") || "").trim();
        const email = String(fd.get("email") || "").trim();
        const phone = String(fd.get("phone") || "").trim();
        const password = String(fd.get("password") || "");
        const confirmPassword = String(fd.get("confirmPassword") || "");
        const unit = String(fd.get("requestedOrgUnitId") || "");

        let message: string | null = null;
        if (!fullName || !email || !password) message = "Vui lòng nhập họ tên, email và mật khẩu.";
        else if (!isValidEmail(email)) message = "Vui lòng nhập địa chỉ email hợp lệ.";
        else if (!isValidPassword(password)) message = "Mật khẩu cần 8–100 ký tự, gồm cả chữ và số.";
        else if (password !== confirmPassword) message = "Mật khẩu nhập lại không khớp.";
        if (message) {
          setError(message);
          return;
        }

        setIsLoading(true);
        try {
          await registerAccount({
            fullName,
            email,
            phone: phone || undefined,
            password,
            requestedOrgUnitId: unit ? Number(unit) : undefined,
          });
          setRegisteredEmail(email);
          appToast.success("Đăng ký thành công", "Tài khoản đang chờ quản trị viên duyệt.");
        } catch (err: unknown) {
          const msg = mapRegisterError(err);
          setError(msg);
          appToast.error("Đăng ký thất bại", msg);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {error && (
        <div
          id="register-error"
          role="alert"
          className="rounded-lg border border-toast-error-border bg-toast-error-background px-4 py-3 text-sm text-toast-error-foreground"
        >
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="rg-name" className="text-sm font-medium">Họ và tên</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="rg-name" name="fullName" autoComplete="name" maxLength={255} className="h-11 pl-11 text-base" disabled={isLoading} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rg-email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="rg-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={200} placeholder="you@example.com" className="h-11 pl-11 text-base" disabled={isLoading} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rg-phone" className="text-sm font-medium">
            Điện thoại <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="rg-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} className="h-11 pl-11 text-base" disabled={isLoading} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rg-unit" className="text-sm font-medium">
          Đơn vị công tác <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
        </Label>
        <select
          id="rg-unit"
          name="requestedOrgUnitId"
          defaultValue=""
          disabled={isLoading}
          aria-describedby="rg-unit-hint"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">Chưa chọn</option>
          {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </select>
        <p id="rg-unit-hint" className="text-xs text-muted-foreground">Quản trị viên sẽ xác nhận đơn vị và chức vụ khi duyệt.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rg-pass" className="text-sm font-medium">Mật khẩu</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="rg-pass"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              maxLength={100}
              className="h-11 pl-11 pr-12 text-base"
              aria-describedby="rg-pass-hint"
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
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rg-pass2" className="text-sm font-medium">Nhập lại mật khẩu</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="rg-pass2" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={100} className="h-11 pl-11 text-base" disabled={isLoading} required />
          </div>
        </div>
      </div>
      <p id="rg-pass-hint" className="text-xs text-muted-foreground">Ít nhất 8 ký tự, gồm cả chữ và số.</p>

      <Button disabled={isLoading} className="h-11 w-full text-base" type="submit">
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span>Đang gửi đăng ký...</span>
          </>
        ) : (
          "Đăng ký"
        )}
      </Button>
    </motion.form>
  );
}
