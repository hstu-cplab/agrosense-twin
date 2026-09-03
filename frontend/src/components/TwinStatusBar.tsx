import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Wifi, WifiOff, Activity } from "lucide-react";

interface TwinStatusBarProps {
  timestamp: number;
}

export default function TwinStatusBar({ timestamp }: TwinStatusBarProps) {
  const [now, setNow] = useState(Date.now());
  const ageMs = now - timestamp;
  const synced = ageMs < 60_000;
  const ageStr = ageMs < 60000
    ? `${Math.floor(ageMs / 1000)}s ago`
    : `${Math.floor(ageMs / 60000)}m ago`;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-fill border border-hair-strong text-xs">
      <div className="flex items-center gap-2">
        {synced
          ? <Wifi size={13} className="text-c-green" />
          : <WifiOff size={13} className="text-c-red" />
        }
        <span className={synced ? "text-c-green" : "text-c-red"}>
          {synced ? "Twin Synced" : "Disconnected"}
        </span>
        <span className="text-ink-muted">·</span>
        <span className="text-ink-muted">BRAC Nursery</span>
      </div>
      <div className="flex items-center gap-2 text-ink-muted">
        {synced && (
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Activity size={11} className="text-c-green" />
          </motion.div>
        )}
        <span>Updated {ageStr}</span>
      </div>
    </div>
  );
}
