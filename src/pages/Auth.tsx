import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUser } from "@/contexts/UserContext";
import {
  ADMIN_ROLE,
  DEFAULT_ROLE,
  USER_ROLE_STORAGE_KEY,
  normalizeRole,
  type UserRole,
} from "@/types/roles";
import { Eye, EyeOff } from "lucide-react"; 
import ZigmaLogo from "../images/logo.png";
import BgImg from "../images/bgSignin.png";

type LoginResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  role?: string;
  unique_id?: string;
  name?: string;
  username?: string;
  email?: string;
  user?: {
    id?: number | string;
    username?: string;
    groups?: string[];
  };
};

export default function Auth() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setUser } = useUser();


  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginUrl = import.meta.env.VITE_API_LOGIN;
      const res = await api.post<LoginResponse>(loginUrl, {
        username,
        password,
      });
      console.log(res);

      const {
        access_token,
        refresh_token,
        role,
        unique_id,
        name,
        username: apiUsername,
        email,
        user,
      } = res.data;

      const groups = Array.isArray(user?.groups) ? user?.groups : [];
      const roleFromGroups = groups
        .map((group) => normalizeRole(group))
        .find((group): group is UserRole => Boolean(group));
      const normalizedRole = normalizeRole(role) ?? roleFromGroups ?? ADMIN_ROLE;
      const resolvedUniqueId =
        unique_id ?? (user?.id != null ? String(user.id) : "");
      const resolvedUsername =
        user?.username ?? apiUsername ?? username;

      localStorage.setItem("access_token", access_token);
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token);
      } else {
        localStorage.removeItem("refresh_token");
      }
      localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizedRole);
      if (resolvedUniqueId) {
        localStorage.setItem("unique_id", resolvedUniqueId);
      } else {
        localStorage.removeItem("unique_id");
      }

      await Promise.resolve();

      setUser({
        name: name ?? resolvedUsername,
        email: email ?? "",
      });

      if (normalizedRole !== ADMIN_ROLE) {
        toast({
          title: t("login.title"),
          description: "This ERP environment is admin-only.",
          variant: "destructive",
        });
        return;
      }

      navigate("/admindashboard", { replace: true });

    } catch (error: any) {
      toast({
        title: t("login.title"),
        description:
          error?.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  console.log(username + " " + password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f6f4] p-4 font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImg})` }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
        {/* LEFT */}
        <div className="flex flex-col items-center justify-center p-10 bg-[#e8f5e9] text-center border-r border-gray-200">
          <img src={ZigmaLogo} className="h-40 w-40 mb-4" />
          <h2 className="text-2xl font-bold text-[#2e7d32]">
            {t("login.left_title")}
          </h2>
          <p className="text-gray-700 text-sm mt-3 max-w-xs leading-relaxed">
            {t("login.left_text")}
          </p>
        </div>

        {/* RIGHT */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                {t("login.title")}
              </h1>
              <p className="text-[#43A047] mt-1 text-sm">
                {t("login.subtitle")}
              </p>
            </div>
            <LanguageSwitcher />
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-gray-700">
                {t("login.username")}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t("login.username_placeholder")}
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                className="h-12 rounded-lg bg-white border border-gray-300 
                  text-gray-800 placeholder-gray-500 
                  focus:ring-2 focus:ring-[#43A047] focus:border-[#43A047]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">
                {t("login.password")}
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.password_placeholder")}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  className="h-12 rounded-lg bg-white border border-gray-300 
                    text-gray-800 placeholder-gray-500 
                    focus:ring-2 focus:ring-[#43A047] focus:border-[#43A047] pr-12"
                  required
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-[#2e7d32] font-medium"
                onClick={() =>
                  toast({
                    title: t("login.forgot_password"),
                    description:
                      "Password recovery is being implemented.",
                  })
                }
              >
                {t("login.forgot_password")}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-[#43A047] hover:bg-[#2e7d32]
                text-white text-base font-semibold shadow-md transition-all"
            >
              {loading
                ? t("login.authenticating")
                : t("login.sign_in")}
            </Button>

            {/* <div className="pt-6 border-t border-dashed border-gray-200">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 text-center">
                {t("login.rnd_shortcuts_label")}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-dashed border-[#43A047] text-[#2e7d32]"
                  onClick={() => handleRndAccess(DEFAULT_ROLE)}
                >
                  {t("login.rnd_dashboard")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-dashed border-orange-500 text-orange-700"
                  onClick={() => handleRndAccess(ADMIN_ROLE)}
                >
                  {t("login.rnd_admin")}
                </Button>
              </div>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
