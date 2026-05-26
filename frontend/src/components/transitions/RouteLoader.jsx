import { motion, AnimatePresence } from "framer-motion";

const RouteLoader = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="route-loader"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[9998] flex items-center justify-center"
        style={{ height: "3px" }}
      >
        <motion.div
          className="h-full w-full"
          style={{ background: "linear-gradient(90deg, transparent, #ef4444, #3b82f6, transparent)", backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 1.2, ease: "easeInOut", repeat: 1 }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

export default RouteLoader;
