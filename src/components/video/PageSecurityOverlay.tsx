import { Shield, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PageSecurityOverlayProps {
  userEmail?: string;
  userName?: string;
  userIp?: string;
  sessionId?: string;
}

/**
 * Full-page forensic watermark overlay that covers the ENTIRE lesson page.
 * Ensures any screenshot, screen recording, or screen share captures the user's identity.
 */
export function PageSecurityOverlay({ userEmail, userName, userIp, sessionId }: PageSecurityOverlayProps) {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleString());
  const userId = userEmail?.split('@')[0] || 'user';
  const sessionShort = sessionId?.slice(0, 8) || Date.now().toString(36);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleString());
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  if (!userEmail) return null;

  const traceId = `${userId}-${sessionShort}`;

  return (
    <>
      {/* Top security banner */}
      <div className="fixed top-0 left-0 right-0 z-[9990] pointer-events-none">
        <div className="flex items-center justify-center gap-2 bg-destructive/10 backdrop-blur-sm py-0.5 px-4">
          <Eye className="w-3 h-3 text-destructive/60" />
          <span className="text-[10px] font-mono text-destructive/60">
            Content monitored • {userEmail} • {userIp || 'IP tracked'} • {timestamp} • SID:{sessionShort}
          </span>
          <Shield className="w-3 h-3 text-destructive/60" />
        </div>
      </div>

      {/* Full-page forensic watermark grid */}
      <div 
        className="fixed inset-0 z-[9989] pointer-events-none overflow-hidden select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        aria-hidden="true"
      >
        {/* Primary diagonal grid - email */}
        <div className="absolute inset-0" style={{ transform: 'rotate(-25deg) scale(2.5)', transformOrigin: 'center' }}>
          {Array.from({ length: 25 }).map((_, row) => (
            <div 
              key={`p-${row}`} 
              className="flex gap-16 mb-10" 
              style={{ marginLeft: row % 2 === 0 ? '0' : '90px' }}
            >
              {Array.from({ length: 14 }).map((_, col) => (
                <span 
                  key={col} 
                  className="text-foreground text-[11px] font-mono whitespace-nowrap"
                  style={{ opacity: 0.035 }}
                >
                  {userEmail}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Secondary grid - IP + name + session */}
        <div className="absolute inset-0" style={{ transform: 'rotate(-55deg) scale(2.5)', transformOrigin: 'center' }}>
          {Array.from({ length: 18 }).map((_, row) => (
            <div 
              key={`s-${row}`} 
              className="flex gap-24 mb-16" 
              style={{ marginLeft: row % 3 === 0 ? '30px' : row % 3 === 1 ? '80px' : '0' }}
            >
              {Array.from({ length: 10 }).map((_, col) => (
                <span 
                  key={col} 
                  className="text-foreground text-[9px] font-mono whitespace-nowrap"
                  style={{ opacity: 0.025 }}
                >
                  {userName || userId} • {userIp || 'tracked'} • {sessionShort}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Micro forensic layer - dense trace IDs */}
        <div className="absolute inset-0" style={{ transform: 'rotate(-10deg) scale(3)', transformOrigin: 'center' }}>
          {Array.from({ length: 30 }).map((_, row) => (
            <div 
              key={`f-${row}`} 
              className="flex gap-6 mb-5"
              style={{ marginLeft: row % 4 * 18 }}
            >
              {Array.from({ length: 30 }).map((_, col) => (
                <span 
                  key={col} 
                  className="text-foreground text-[6px] font-mono whitespace-nowrap"
                  style={{ opacity: 0.018 }}
                >
                  {traceId}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Ultra-dense layer for screenshot resilience */}
        <div className="absolute inset-0" style={{ transform: 'rotate(-40deg) scale(3.5)', transformOrigin: 'center' }}>
          {Array.from({ length: 35 }).map((_, row) => (
            <div 
              key={`u-${row}`} 
              className="flex gap-4 mb-3"
              style={{ marginLeft: (row % 5) * 12 }}
            >
              {Array.from({ length: 40 }).map((_, col) => (
                <span 
                  key={col} 
                  className="text-foreground text-[5px] font-mono whitespace-nowrap"
                  style={{ opacity: 0.012 }}
                >
                  {userId}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Anti-recording stripe pattern - visible in screen recordings */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(120deg, transparent, transparent 80px, rgba(128,128,128,0.008) 80px, rgba(128,128,128,0.008) 160px)',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    </>
  );
}
