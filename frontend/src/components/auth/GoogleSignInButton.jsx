import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { useUnifiedAuth } from "../../context/UnifiedAuthContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
let gsiInitialized = false;

const isValidClientId = (id) =>
  id &&
  id !== "your_google_client_id_here" &&
  /\.apps\.googleusercontent\.com$/.test(id) &&
  !id.startsWith("GOCSPX-");

const GoogleSignInButton = ({ redirectTo = "/account" }) => {
  const { loginWithGoogle, loading } = useUnifiedAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const scriptAddedRef = useRef(false);
  const [badConfig, setBadConfig] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      await loginWithGoogle(response.credential);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Google sign-in failed. Please try again.";
      toast.error(msg);
      console.error("Google sign-in failed:", err);
    }
  }, [loginWithGoogle, navigate, redirectTo]);

  useEffect(() => {
    if (!isValidClientId(CLIENT_ID)) {
      setBadConfig(true);
      return;
    }

    const initGIS = () => {
      if (!window.google?.accounts?.id) return;
      if (!gsiInitialized) {
        try {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse,
            cancel_on_tap_outside: false,
            locale: "en_US",
          });
          gsiInitialized = true;
        } catch {
          setBadConfig(true);
          return;
        }
      }

      if (btnRef.current) {
        try {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: "outline",
            size: "large",
            shape: "pill",
            width: btnRef.current.offsetWidth || 320,
          });
        } catch {
          setBadConfig(true);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGIS();
    } else if (!scriptAddedRef.current) {
      scriptAddedRef.current = true;
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGIS;
      script.onerror = () => setLoadFailed(true);
      document.body.appendChild(script);
    }
  }, [handleCredentialResponse]);

  if (loading) {
    return (
      <div className="flex h-[48px] w-full items-center justify-center rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (badConfig) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Google Sign-In unavailable. Check that{" "}
          <code className="rounded bg-amber-100/50 px-1 dark:bg-amber-800/30">VITE_GOOGLE_CLIENT_ID</code>{" "}
          is a valid OAuth Client ID (<em>not</em> the Client Secret) ending in{" "}
          <code className="rounded bg-amber-100/50 px-1 dark:bg-amber-800/30">.apps.googleusercontent.com</code>
        </p>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800/50">
        <WifiOff className="h-4 w-4 shrink-0 text-gray-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Could not load Google Sign-In. Check your internet connection or disable ad blocker, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={btnRef}
      id="google-signin-button"
      className="w-full min-h-[48px] flex items-center justify-center"
    />
  );
};

export default GoogleSignInButton;
