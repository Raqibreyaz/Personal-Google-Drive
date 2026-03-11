import { useState, useEffect, useRef } from "react";

const OTP_COOLDOWN_SEC = 60;

/**
 * Hook to manage an OTP resend countdown timer.
 * @returns {{ secondsLeft: number, startTimer: () => void }}
 */
export default function useOtpTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    setSecondsLeft(OTP_COOLDOWN_SEC);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => clearTimer, []);

  return { secondsLeft, startTimer };
}
