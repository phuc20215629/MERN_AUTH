import { motion } from "framer-motion";

const FloatingCircle = ({ color, size, top, left, delay }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${color} ${size} opapcity-50 blur-xl `}
      style={{ top, left }}
      animate={{
        x: ["0%", "100%", "0%"],
        y: ["0%", "100%", "0%"],
        rotate: [0, 360],
      }}
      transition={{
        duration: 20,
        ease: "linear",
        repeat: Infinity,
        delay: delay,
        bounce: 0.5,
      }}
      aria-hidden
    ></motion.div>
  );
};

export default FloatingCircle;
