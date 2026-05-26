import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const LoginPage = () => {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Admin Login" description="Secure Mini Hobbies admin login." canonical="/admin/login" />
      <section className="grid min-h-screen place-items-center bg-graphite px-4">
        <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-ember text-white">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-black">Admin login</h1>
          <p className="mt-2 text-sm text-gray-600">Manage products, categories, orders, stock, and uploads.</p>
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 grid gap-3">
            <input className="input text-base" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <div className="relative">
              <input className="input w-full pr-10 text-base" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button disabled={loading} className="btn-primary mt-5 w-full min-h-[48px] disabled:bg-gray-300">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </>
  );
};

export default LoginPage;
