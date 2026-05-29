import { Suspense, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";
import SplashScreen from "./components/splash/SplashScreen.jsx";
import { CustomerAuthProvider } from "./context/CustomerAuthContext.jsx";
import ChatWidget from "./components/chat/ChatWidget.jsx";

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
          <ChatWidget />
        </CustomerAuthProvider>
      </BrowserRouter>
    </>
  );
};

export default App;
