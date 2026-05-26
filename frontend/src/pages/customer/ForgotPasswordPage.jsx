import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import { forgotPassword } from "../../services/customerAuthService.js";

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
      await forgotPassword({ email });
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
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-soft backdrop-blur-xl sm:p-8">
            <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>

            {sent ? (
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h1 className="mt-4 text-xl font-black">Check your email</h1>
                <p className="mt-2 text-sm text-gray-500">
                  If an account exists for <strong className="text-gray-700">{email}</strong>, we&apos;ve sent a password reset link.
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-black">Forgot password?</h1>
                <p className="mt-1 text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Email</label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full pl-10" placeholder="you@example.com" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full min-h-[48px] disabled:bg-gray-300">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ForgotPasswordPage;
