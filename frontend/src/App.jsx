import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <AppRoutes />
    </Suspense>
  </BrowserRouter>
);

export default App;
