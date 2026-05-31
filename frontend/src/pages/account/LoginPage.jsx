import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Seo from "../../components/Seo.jsx";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton.jsx";
import { useUnifiedAuth } from "../../context/UnifiedAuthContext.jsx";

const LoginPage = () => {
  const { login, loading } = useUnifiedAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await login(form);
      if (result?.user?.suspension) {
        navigate("/suspended", { replace: true });
        return;
      }
      if (result?.role === "admin") {
        navigate(state?.from || "/admin", { replace: true });
      } else {
        navigate(state?.from || "/account", { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.suspended) {
        navigate("/suspended", { replace: true });
        return;
      }
      const status = err.response?.status;
      if (status === 429) {
        setError("Too many attempts. Account temporarily locked for 15 minutes.");
      } else {
        setError(err.response?.data?.message || "Invalid email or password.");
      }
    }
  };

  return (
    <>
      <Seo title="Sign In" description="Sign in to your Mini Hobbies account." />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12 dark:from-graphite dark:via-gray-900 dark:to-graphite">
        <div className="pointer-events-none absolute -left-1/4 -right-1/4 top-0 h-96 bg-gradient-to-br from-ember/5 to-mint/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-ember/5 to-mint/5 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative rounded-2xl border border-white/20 bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8 dark:bg-graphite/90 dark:border-white/10">
            <div className="mb-6 text-center">
              <Link to="/" className="inline-block text-xl font-black tracking-tight text-gray-950 dark:text-white">
                Mini Hobbies
              </Link>
              <h1 className="mt-4 text-2xl font-black text-gray-950 dark:text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account.</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input w-full pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input w-full pl-10 pr-10 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-ember focus:ring-ember dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-semibold text-ember hover:text-red-600 dark:hover:text-red-400"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full min-h-[48px] disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-400 dark:bg-graphite/90 dark:text-gray-500">
                  or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton />
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-ember hover:text-red-600 dark:hover:text-red-400">
                  Create one <ArrowRight className="inline h-3 w-3" />
                </Link>
              </p>

            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default LoginPage;
