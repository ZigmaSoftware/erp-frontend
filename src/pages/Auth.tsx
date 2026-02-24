import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUser } from "@/contexts/UserContext";
import {
  ADMIN_ROLE,
  USER_ROLE_STORAGE_KEY,
  normalizeRole,
  type UserRole,
} from "@/types/roles";
import { Eye, EyeOff } from "lucide-react";
import ZigmaLogo from "../images/logo.png";
import BgImg from "../images/bgSignin.png";
import { jwtDecode } from "jwt-decode";
import { loginApi, refreshLoginApi } from "@/helpers/admin";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
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
  is_superuser?: boolean;
};

type JwtPayload = {
  exp?: number;
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

  const isAccessTokenValid = useCallback((token?: string) => {
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const now = Math.floor(Date.now() / 1000);
      console.log(now);

      return decoded.exp ? decoded.exp > now : true;
    } catch (err) {
      console.error("Invalid access token", err);
      return false;
    }
  }, []);

  const persistSession = useCallback(
    (payload: LoginResponse, fallbackUsername: string): UserRole => {
      const {
        access_token,
        refresh_token,
        role,
        unique_id,
        name,
        username: apiUsername,
        email,
        user,
        is_superuser,
      } = payload;

      const groups: string[] = Array.isArray(user?.groups) ? user.groups : [];

      const roleFromGroups = groups
        .map((group) => normalizeRole(group))
        .find((group): group is UserRole => Boolean(group));

      const normalizedRole =
        normalizeRole(role) ??
        roleFromGroups ??
        (is_superuser ? ADMIN_ROLE : null) ??
        ADMIN_ROLE;

      const resolvedUniqueId =
        unique_id ?? (user?.id != null ? String(user.id) : "");
      const resolvedUsername = user?.username ?? apiUsername ?? fallbackUsername;

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

      const finalName = name ?? resolvedUsername;
      const finalEmail = email ?? "";

      setUser({
        name: finalName,
        email: finalEmail,
      });

      return normalizedRole;
    },
    [setUser]
  );

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedAccessToken = localStorage.getItem("access_token");
      const storedRefreshToken = localStorage.getItem("refresh_token");

      if (storedAccessToken && isAccessTokenValid(storedAccessToken)) {
        navigate("/admindashboard", { replace: true });
        return;
      }

      if (!storedRefreshToken) {
        return;
      }

      try {
        const refreshed = await refreshLoginApi.create({
          refresh_token: storedRefreshToken,
        });
        const normalizedRole = persistSession(refreshed, "");
        if (normalizedRole === ADMIN_ROLE) {
          navigate("/admindashboard", { replace: true });
        }
      } catch (err) {
        console.error("Failed to refresh session", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    };

    bootstrapSession();
  }, [navigate, persistSession, isAccessTokenValid]);

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        username,
        password,
      };

      const response = await loginApi.create<LoginResponse>(payload);
      const normalizedRole = persistSession(response, username);

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
        description: error?.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
                    description: "Password recovery is being implemented.",
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
              {loading ? t("login.authenticating") : t("login.sign_in")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
