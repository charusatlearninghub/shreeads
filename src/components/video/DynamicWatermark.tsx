import { motion, AnimatePresence } from 'framer-motion';
import { useWatermarkOpacity } from '@/hooks/usePlatformSettings';
import { Shield } from 'lucide-react';

interface WatermarkData {
  email: string;
  name: string;
  ip: string;
  timestamp: string;
  position: { x: number; y: number };
  sessionId?: string;
  /** 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right */
  corner?: number;
}

interface DynamicWatermarkProps {
  data: WatermarkData;
  visible: boolean;
}

export function DynamicWatermark({ data, visible }: DynamicWatermarkProps) {
  const { bgOpacity, centerOpacity } = useWatermarkOpacity();

  if (!visible || !data.email) return null;

  const watermarkText = data.email;
  const secondaryText = `${data.ip} • ${data.timestamp}`;
  const userId = data.email.split('@')[0];
  const sessionShort = data.sessionId?.slice(0, 8) || '';

  const cornerOpacity = Math.min(centerOpacity * 0.85, 0.35);
  const secondLayerOpacity = Math.max(bgOpacity * 0.7, 0.025);
  const forensicOpacity = Math.max(bgOpacity * 0.5, 0.02);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Protection badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 z-40">
        <Shield className="w-3 h-3 text-green-400" />
        <span className="text-green-400 text-[10px] font-mono font-bold">PROTECTED</span>
      </div>

      {/* User ID badge */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-0.5">
        <span className="text-white/50 text-[10px] font-mono">{userId} • {data.ip} • {sessionShort}</span>
      </div>

      {/* Corner watermarks - all 4 corners */}
      <div className="absolute top-3 left-3">
        <span className="text-white text-xs font-mono" style={{ opacity: cornerOpacity }}>{watermarkText}</span>
      </div>
      <div className="absolute top-3 right-12">
        <span className="text-white text-xs font-mono" style={{ opacity: cornerOpacity }}>{data.ip}</span>
      </div>
      <div className="absolute bottom-20 left-3">
        <span className="text-white text-xs font-mono" style={{ opacity: cornerOpacity }}>{data.name || watermarkText}</span>
      </div>
      <div className="absolute bottom-20 right-3">
        <span className="text-white text-xs font-mono" style={{ opacity: cornerOpacity }}>{data.timestamp}</span>
      </div>

      {/* Moving center watermark */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${data.position.x}-${data.position.y}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute"
          style={{
            left: `${data.position.x}%`,
            top: `${data.position.y}%`,
            transform: 'translate(-50%, -50%) rotate(-25deg)',
          }}
        >
          <div className="text-center space-y-0.5">
            <p className="text-white text-xl font-bold font-mono" style={{ opacity: centerOpacity }}>{watermarkText}</p>
            <p className="text-white text-xs font-mono" style={{ opacity: centerOpacity * 0.65 }}>{secondaryText}</p>
            {sessionShort && (
              <p className="text-white text-[9px] font-mono" style={{ opacity: centerOpacity * 0.5 }}>SID: {sessionShort}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Light diagonal pattern (subtle, non-intrusive) */}
      <div className="absolute inset-0" style={{ transform: 'rotate(-30deg) scale(1.5)', transformOrigin: 'center' }}>
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="flex gap-40 mb-40" style={{ marginLeft: row % 2 === 0 ? '0' : '120px' }}>
            {Array.from({ length: 3 }).map((_, col) => (
              <span key={col} className="text-white text-xs font-mono whitespace-nowrap" style={{ opacity: Math.min(bgOpacity, 0.05) }}>
                {watermarkText}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
