import { Suspense, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";
import SplashScreen from "./components/splash/SplashScreen.jsx";
import { CustomerAuthProvider } from "./context/CustomerAuthContext.jsx";

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CustomerAuthProvider>
          <Suspense fallback={<PageLoader />}>
            <AppRoutes />
          </Suspense>
        </CustomerAuthProvider>
      </BrowserRouter>
    </>
  );
};

export default App;
