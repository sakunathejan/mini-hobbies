const OAuthPopupHandler = () => {
  if (typeof window === "undefined" || !window.opener) return null;

  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");
  if (!idToken) return null;

  window.opener.postMessage({ credential: idToken }, window.location.origin);
  window.close();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-gray-600">Sign-in complete, closing...</p>
      </div>
    </div>
  );
};

export default OAuthPopupHandler;
