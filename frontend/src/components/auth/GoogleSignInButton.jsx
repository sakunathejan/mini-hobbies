import { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useUnifiedAuth } from "../../context/UnifiedAuthContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const isValidClientId = (id) =>
  id &&
  id !== "your_google_client_id_here" &&
  /\.apps\.googleusercontent\.com$/.test(id) &&
  !id.startsWith("GOCSPX-");

const GoogleSignInButton = ({ redirectTo = "/account" }) => {
  const { loginWithGoogle, loading } = useUnifiedAuth();
  const navigate = useNavigate();
  const [badConfig, setBadConfig] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const listenerAttached = useRef(false);
  const popupRef = useRef(null);

  const handleCredentialResponse = useCallback(async (credential) => {
    try {
      await loginWithGoogle(credential);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Google sign-in failed. Please try again.";
      toast.error(msg);
      console.error("Google sign-in failed:", err);
    }
  }, [loginWithGoogle, navigate, redirectTo]);

  const handleGoogleSignIn = useCallback(() => {
    if (!isValidClientId(CLIENT_ID)) {
      setBadConfig(true);
      return;
    }

    const nonce = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: window.location.origin,
      scope: "openid profile email",
      response_type: "id_token",
      nonce,
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      "google-oauth",
      "width=500,height=700,left=100,top=100"
    );

    if (!popup) {
      toast.error("Pop-up was blocked. Please allow pop-ups for this site.");
      return;
    }

    popupRef.current = popup;
    setSigningIn(true);

    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) return;
      const credential = event.data?.credential;
      if (!credential) return;

      setSigningIn(false);
      window.removeEventListener("message", messageHandler);
      listenerAttached.current = false;

      try { popup.close(); } catch {}
      popupRef.current = null;

      handleCredentialResponse(credential);
    };

    if (listenerAttached.current) {
      window.removeEventListener("message", messageHandler);
    }
    window.addEventListener("message", messageHandler);
    listenerAttached.current = true;

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        if (listenerAttached.current) {
          window.removeEventListener("message", messageHandler);
          listenerAttached.current = false;
        }
        popupRef.current = null;
        setSigningIn(false);
      }
    }, 500);

    setTimeout(() => {
      if (listenerAttached.current) {
        window.removeEventListener("message", messageHandler);
        listenerAttached.current = false;
        try { popup.close(); } catch {}
        popupRef.current = null;
        setSigningIn(false);
        toast.error("Google sign-in timed out. Please try again.");
      }
    }, 120000);
  }, [handleCredentialResponse]);

  if (loading || signingIn) {
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

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={signingIn}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Sign in with Google
    </button>
  );
};

export default GoogleSignInButton;
