import { useEffect, useState, useRef } from "react";

interface FallingBill {
  id: number;
  left: number;     // % from left
  delay: number;     // animation delay in seconds
  duration: number;  // fall duration
  rotation: number;  // end rotation
  size: number;      // font size in px
}

export function FallingBills() {
  const [bills, setBills] = useState<FallingBill[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    // Create initial batch
    const initial: FallingBill[] = Array.from({ length: 8 }, () => createBill());
    setBills(initial);

    // Continuously add new bills
    const interval = setInterval(() => {
      setBills((prev) => {
        // Keep max 12 bills to avoid clutter
        const trimmed = prev.length > 10 ? prev.slice(-8) : prev;
        return [...trimmed, createBill()];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  function createBill(): FallingBill {
    return {
      id: nextId.current++,
      left: 5 + Math.random() * 85,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 3,
      rotation: -30 + Math.random() * 60,
      size: 16 + Math.random() * 12,
    };
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {bills.map((bill) => (
        <span
          key={bill.id}
          className="absolute animate-fall-bill"
          style={{
            left: `${bill.left}%`,
            top: "-24px",
            fontSize: `${bill.size}px`,
            animationDelay: `${bill.delay}s`,
            animationDuration: `${bill.duration}s`,
            "--bill-rotation": `${bill.rotation}deg`,
          } as React.CSSProperties}
        >
          💶
        </span>
      ))}
    </div>
  );
}
