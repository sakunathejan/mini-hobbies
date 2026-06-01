import { useState, useEffect } from "react";
import { Ban, Clock, Loader2, ArrowLeft, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { getMyModerationStatus } from "../moderation/moderationService.js";

const SuspendedPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyModerationStatus()
      .then((s) => {
        setStatus(s.status);
        setActiveCase(s.activeCase);
        if (s.status === "active") {
          navigate("/account", { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isBan = status === "banned";
  const hours = activeCase?.duration || 0;
  const expiresAt = activeCase?.expiresAt ? new Date(activeCase.expiresAt) : null;
  const remaining = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 3600000)) : 0;

  return (
    <>
      <Seo title="Account Restricted" description="Your account has been restricted." />
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-8 shadow-soft">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isBan ? "bg-red-100" : "bg-orange-100"}`}>
              {isBan ? <Ban className={`h-8 w-8 text-red-600`} /> : <Clock className={`h-8 w-8 text-orange-600`} />}
            </div>
            <h1 className="mt-4 text-2xl font-black text-gray-900">
              {isBan ? "Account Banned" : "Account Suspended"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isBan
                ? "Your account has been permanently banned. You can no longer access your account."
                : `Your account has been temporarily suspended for ${hours} hour${hours !== 1 ? "s" : ""}.`}
            </p>
            {!isBan && remaining > 0 && (
              <p className="mt-2 text-sm font-semibold text-orange-600">
                Approximately {remaining} hour{remaining !== 1 ? "s" : ""} remaining.
              </p>
            )}
            {activeCase?.reason && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-left text-sm text-gray-700">
                <p className="text-xs font-semibold text-gray-500">REASON</p>
                <p className="mt-1">{activeCase.reason}</p>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3">
              {isBan ? null : (
                <Link to="/account/appeal" className="btn-primary text-sm">
                  Submit an Appeal
                </Link>
              )}
              <Link to="/" className="btn-secondary text-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SuspendedPage;
