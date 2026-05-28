import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, User, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton.jsx";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";

const strengthConfig = [
  { label: "Weak", color: "bg-red-500", text: "text-red-600", minScore: 0 },
  { label: "Fair", color: "bg-orange-500", text: "text-orange-600", minScore: 1 },
  { label: "Good", color: "bg-yellow-500", text: "text-yellow-600", minScore: 2 },
  { label: "Strong", color: "bg-green-500", text: "text-green-600", minScore: 3 },
  { label: "Very strong", color: "bg-emerald-500", text: "text-emerald-600", minScore: 4 },
];

const calcStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const requirements = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "Uppercase & lowercase", test: (v) => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { label: "At least one number", test: (v) => /[0-9]/.test(v) },
  { label: "Special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const RegisterPage = () => {
  const { setCustomerData, loading } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (registered) navigate("/account", { replace: true });
  }, [registered, navigate]);

  const strength = useMemo(() => calcStrength(form.password), [form.password]);
  const strengthInfo = strengthConfig[strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const { registerCustomer } = await import("../../services/customerAuthService.js");
      const data = await registerCustomer({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      localStorage.setItem("mini_hobbies_customer_token", data.token);
      setCustomerData(data.customer);
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <>
      <Seo title="Create Account" description="Join Mini Hobbies — create your collector account." />
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-soft backdrop-blur-xl sm:p-8">
            <div className="mb-6 text-center">
              <Link to="/" className="inline-block text-xl font-black tracking-tight text-gray-950">Mini Hobbies</Link>
              <h1 className="mt-4 text-2xl font-black">Create your account</h1>
              <p className="mt-1 text-sm text-gray-500">Join the collector community.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Full name</label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full pl-10" placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Email</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full pl-10" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input mt-1" placeholder="077 123 4567" />
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
                    placeholder="Create a strong password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {form.password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthInfo.color : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthInfo.text}`}>{strengthInfo.label} password</p>
                    <ul className="space-y-0.5">
                      {requirements.map((req) => {
                        const passed = req.test(form.password);
                        return (
                          <li key={req.label} className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-600" : "text-gray-400"}`}>
                            <Check className={`h-3 w-3 ${passed ? "text-green-500" : "text-gray-300"}`} />
                            {req.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Confirm password</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="input w-full pl-10"
                    placeholder="Repeat your password"
                  />
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !form.name || !form.email || !form.password || form.password !== form.confirmPassword || strength < 1}
                className="btn-primary w-full min-h-[48px] disabled:bg-gray-300"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-400">or sign up with</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton redirectTo="/account" />
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-ember hover:text-red-600">Sign in <ArrowRight className="inline h-3 w-3" /></Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default RegisterPage;
