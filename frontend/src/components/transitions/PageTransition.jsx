import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import RouteLoader from "./RouteLoader.jsx";

const VARIANTS = {
  default: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  checkout: {
    initial: { opacity: 0, x: 80, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -80, scale: 0.97 },
  },
  product: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  },
  admin: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
  },
};

const REDUCED_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const TRANSITION_CONFIG = {
  duration: 0.3,
  ease: [0.45, 0, 0.1, 1],
};

const LOADER_DURATION = 400;

const getRouteType = (pathname) => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/checkout" || pathname === "/cart" || pathname.startsWith("/order-")) return "checkout";
  if (pathname.startsWith("/products")) return "product";
  return "default";
};

const PageTransition = ({ children }) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [showLoader, setShowLoader] = useState(false);
  const prevPath = useRef(location.pathname);
  const timerRef = useRef(null);

  const routeType = getRouteType(location.pathname);
  const variants = prefersReducedMotion ? REDUCED_VARIANTS : (VARIANTS[routeType] || VARIANTS.default);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      cleanup();
      setShowLoader(true);
      timerRef.current = setTimeout(() => {
        setShowLoader(false);
      }, LOADER_DURATION);
      prevPath.current = location.pathname;
    }
    return cleanup;
  }, [location.pathname, cleanup]);

  return (
    <>
      <RouteLoader visible={!prefersReducedMotion && showLoader} />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={TRANSITION_CONFIG}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default PageTransition;
