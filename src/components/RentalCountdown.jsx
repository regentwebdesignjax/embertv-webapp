import React from "react";
import { Clock } from "lucide-react";

export default function RentalCountdown({ expiresAt }) {
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-[#EF6418] font-mono text-sm">
      <Clock className="w-4 h-4" />
      <span>Time left: {timeLeft}</span>
    </div>
  );
}