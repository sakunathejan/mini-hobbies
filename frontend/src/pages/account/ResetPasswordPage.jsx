import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Seo from "../../components/Seo.jsx";
import api from "../../services/api.js";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/unified/reset-password", { token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-graphite dark:via-gray-900 dark:to-graphite">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-xl font-black text-red-600 dark:text-red-400">Invalid reset link</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This link is missing or invalid.</p>
          <Link to="/forgot-password" className="btn-primary mt-4 inline-flex">Request a new link</Link>
        </motion.div>
      </section>
    );
  }

  return (
    <>
      <Seo title="Reset Password" description="Reset your Mini Hobbies password." />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12 dark:from-graphite dark:via-gray-900 dark:to-graphite">
        <div className="pointer-events-none absolute -left-1/4 -right-1/4 top-0 h-96 bg-gradient-to-br from-ember/5 to-mint/5 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative rounded-2xl border border-white/20 bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8 dark:bg-graphite/90 dark:border-white/10">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="mt-4 text-xl font-black text-gray-950 dark:text-white">Password reset!</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your password has been updated.</p>
                <Link to="/login" className="btn-primary mt-6 inline-flex">Sign in</Link>
              </motion.div>
            ) : (
              <>
                <h1 className="text-xl font-black text-gray-950 dark:text-white">Set new password</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Must be at least 8 characters.</p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">New password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="input w-full pr-10 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        placeholder="New password"
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
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Confirm new password</label>
                    <input
                      type="password"
                      required
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="input mt-1 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      placeholder="Repeat new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full min-h-[48px] disabled:bg-gray-300 dark:disabled:bg-gray-700"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Resetting..." : "Reset password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default ResetPasswordPage;
