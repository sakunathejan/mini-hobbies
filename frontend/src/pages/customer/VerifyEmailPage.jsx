import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo.jsx";
import { verifyEmail } from "../../services/customerAuthService.js";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const { refreshCustomer } = useCustomerAuth();

  useEffect(() => {
    if (!token) { setStatus("missing"); return; }
    verifyEmail(token)
      .then(async () => {
        setStatus("success");
        await refreshCustomer();
      })
      .catch(() => setStatus("error"));
  }, [token, refreshCustomer]);

  return (
    <>
      <Seo title="Verify Email" description="Verify your Mini Hobbies email address." />
      <section className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
              <h1 className="mt-4 text-xl font-black">Verifying your email...</h1>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="mt-4 text-xl font-black">Email verified!</h1>
              <p className="mt-2 text-sm text-gray-500">Your account is now fully activated.</p>
              <button onClick={() => navigate("/account")} className="btn-primary mt-6 inline-flex">Go to account</button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="mt-4 text-xl font-black">Verification failed</h1>
              <p className="mt-2 text-sm text-gray-500">The link may have expired or is invalid.</p>
              <Link to="/login" className="btn-primary mt-6 inline-flex">Sign in</Link>
            </>
          )}
          {status === "missing" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="mt-4 text-xl font-black">No token provided</h1>
              <p className="mt-2 text-sm text-gray-500">Check your email for the full verification link.</p>
              <Link to="/" className="btn-primary mt-6 inline-flex">Go home</Link>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default VerifyEmailPage;
