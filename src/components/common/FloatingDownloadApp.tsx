import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

const FloatingDownloadApp = () => {
  return (
    <motion.a
      href="https://t.me/shree_ads"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 180 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-[calc(5rem+3.5rem)] md:bottom-[calc(1.5rem+3.5rem+0.75rem)] right-4 md:right-6 z-40 h-[50px] px-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30 flex items-center gap-2 font-semibold text-sm hover:shadow-xl hover:shadow-purple-500/40 transition-shadow"
      aria-label="Download App"
    >
      <Download className="w-5 h-5" />
      <span>Download App</span>

      {/* Pulse glow ring */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 animate-[pulse-glow_4s_ease-in-out_infinite] opacity-0 pointer-events-none" />

      {/* Bounce attention dot */}
      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-bounce" />
    </motion.a>
  );
};

export default FloatingDownloadApp;
