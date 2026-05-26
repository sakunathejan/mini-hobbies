import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Seo from "../../components/Seo.jsx";
import api from "../../services/api.js";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/unified/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Forgot Password" description="Reset your Mini Hobbies password." />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12 dark:from-graphite dark:via-gray-900 dark:to-graphite">
        <div className="pointer-events-none absolute -left-1/4 -right-1/4 top-0 h-96 bg-gradient-to-br from-ember/5 to-mint/5 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative rounded-2xl border border-white/20 bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8 dark:bg-graphite/90 dark:border-white/10">
            <Link
              to="/login"
              className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="mt-4 text-xl font-black text-gray-950 dark:text-white">Check your email</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  If an account exists for <strong className="text-gray-700 dark:text-gray-300">{email}</strong>, we&apos;ve sent a password reset link.
                </p>
              </motion.div>
            ) : (
              <>
                <h1 className="text-xl font-black text-gray-950 dark:text-white">Forgot password?</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter your email and we&apos;ll send you a reset link.</p>

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
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email</label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input w-full pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full min-h-[48px] disabled:bg-gray-300 dark:disabled:bg-gray-700"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Sending..." : "Send reset link"}
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

export default ForgotPasswordPage;
