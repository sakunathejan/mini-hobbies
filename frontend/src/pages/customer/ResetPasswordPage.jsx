import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import { resetPassword } from "../../services/customerAuthService.js";

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
      await resetPassword({ token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-black text-red-600">Invalid reset link</h1>
          <p className="mt-2 text-sm text-gray-500">This link is missing or invalid.</p>
          <Link to="/forgot-password" className="btn-primary mt-4 inline-flex">Request a new link</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <Seo title="Reset Password" description="Reset your Mini Hobbies password." />
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-soft backdrop-blur-xl sm:p-8">
            {done ? (
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h1 className="mt-4 text-xl font-black">Password reset!</h1>
                <p className="mt-2 text-sm text-gray-500">Your password has been updated.</p>
                <Link to="/login" className="btn-primary mt-6 inline-flex">Sign in</Link>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-black">Set new password</h1>
                <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters.</p>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">New password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="input w-full pr-10"
                        placeholder="New password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Confirm new password</label>
                    <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input mt-1" placeholder="Repeat new password" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full min-h-[48px] disabled:bg-gray-300">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Resetting..." : "Reset password"}
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

export default ResetPasswordPage;
