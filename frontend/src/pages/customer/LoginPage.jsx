import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";

const LoginPage = () => {
  const { login, loading } = useCustomerAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      navigate(state?.from || "/account", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    }
  };

  return (
    <>
      <Seo title="Sign In" description="Sign in to your Mini Hobbies account." />
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-soft backdrop-blur-xl sm:p-8">
            <div className="mb-6 text-center">
              <Link to="/" className="inline-block text-xl font-black tracking-tight text-gray-950">Mini Hobbies</Link>
              <h1 className="mt-4 text-2xl font-black">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500">Sign in to your collector account.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Email</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input w-full pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input w-full pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-ember focus:ring-ember" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="font-semibold text-ember hover:text-red-600">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[48px] disabled:bg-gray-300">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-ember hover:text-red-600">Create one <ArrowRight className="inline h-3 w-3" /></Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginPage;
