import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const FloatingDownloadApp = () => {
  const location = useLocation();

  if (location.pathname !== '/') return null;

  return (
    <motion.a
      href="https://github.com/charusatlearninghub/shreeads/releases/download/v1.0.0/ShreeAds.apk"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 180 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="download-app-button flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30 transition-shadow hover:shadow-xl hover:shadow-purple-500/40 h-11 px-3 text-xs md:h-[50px] md:px-5 md:text-sm"
      aria-label="Download App"
      style={{
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <Download className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
      <span className="truncate whitespace-nowrap">Download App</span>

      {/* Pulse glow ring */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 animate-[pulse-glow_4s_ease-in-out_infinite] opacity-0 pointer-events-none" />

      {/* Bounce attention dot */}
      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-bounce" />
    </motion.a>
  );
};

export default FloatingDownloadApp;
