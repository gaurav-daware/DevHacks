import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, ArrowLeft, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "register" ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ username: "", email: "", password: "" });

  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const u = await login(loginForm.email, loginForm.password);
      toast.success(`Welcome back, ${u.username}!`);
      navigate(u.role === "admin" ? "/admin" : "/problems");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, email, password } = regForm;
    if (!username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      toast.success("Account created! Welcome to CodeArena.");
      navigate("/problems");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[120px]" />
      </div>

      {/* Back link */}
      <Link to="/" className="absolute top-4 left-4 flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-xl">
            Code<span className="text-primary">Arena</span>
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#121215] border border-[#27272a] rounded-sm p-1 mb-6">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all ${
              tab === "login"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("login")}
            data-testid="tab-login"
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all ${
              tab === "register"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("register")}
            data-testid="tab-register"
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in" data-testid="login-form">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="bg-[#121215] border-[#27272a] focus:border-primary/50 h-10"
                data-testid="login-email"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-[#121215] border-[#27272a] focus:border-primary/50 h-10 pr-10"
                  data-testid="login-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>

            {/* Admin hint */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono">
                Demo admin: admin@codearena.com / Admin@123
              </p>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4 animate-fade-in" data-testid="register-form">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Username</Label>
              <Input
                type="text"
                placeholder="yourhandle"
                value={regForm.username}
                onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                className="bg-[#121215] border-[#27272a] focus:border-primary/50 h-10"
                data-testid="register-username"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                className="bg-[#121215] border-[#27272a] focus:border-primary/50 h-10"
                data-testid="register-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="bg-[#121215] border-[#27272a] focus:border-primary/50 h-10 pr-10"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
