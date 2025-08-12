import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, IndianRupee, MessageCircle, Mail } from "lucide-react";

interface SuccessOverlayProps {
  type: "invoice_sent" | "reminder_sent" | "mark_paid" | "task_done";
  isVisible: boolean;
  onComplete: () => void;
}

const Confetti = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-2 h-2 bg-primary rounded-full"
    initial={{ opacity: 0, scale: 0, y: 0, x: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0.5],
      y: [0, -100, -200],
      x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100],
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: "easeOut",
    }}
  />
);

const CornerConfetti = () => (
  <div className="fixed top-4 right-4 pointer-events-none z-50">
    {Array.from({ length: 8 }).map((_, i) => (
      <Confetti key={i} delay={i * 0.1} />
    ))}
  </div>
);

export function SuccessOverlay({ type, isVisible, onComplete }: SuccessOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (type === "invoice_sent") {
        setShowConfetti(true);
        const timer = setTimeout(() => {
          setShowConfetti(false);
          onComplete();
        }, 1200);
        return () => clearTimeout(timer);
      } else if (type === "reminder_sent") {
        setShowConfetti(true);
        const timer = setTimeout(() => {
          setShowConfetti(false);
          onComplete();
        }, 800);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(onComplete, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, type, onComplete]);

  if (type === "invoice_sent") {
    return (
      <AnimatePresence>
        {isVisible && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
                <motion.div
                  className="w-16 h-16 bg-success rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Invoice Sent!</h3>
                  <p className="text-gray-600">Your invoice has been delivered successfully</p>
                </div>
              </div>
            </motion.div>
            {showConfetti && (
              <div className="fixed top-20 right-8 pointer-events-none z-50">
                {Array.from({ length: 15 }).map((_, i) => (
                  <Confetti key={i} delay={i * 0.05} />
                ))}
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    );
  }

  if (type === "reminder_sent") {
    return (
      <AnimatePresence>
        {showConfetti && <CornerConfetti />}
        {isVisible && (
          <motion.div
            className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 border"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3, type: "spring" }}
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-sm font-medium text-gray-900">Reminder sent!</span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (type === "mark_paid") {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-4 right-4 bg-success text-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-50"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
            >
              <IndianRupee className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-sm font-medium">Payment marked!</span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
}