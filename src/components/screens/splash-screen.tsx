import { motion } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-[#0f1729] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000)
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-6"
      >
        <img 
          src="/lantern-logo.png" 
          alt="Lantern Logo" 
          className="w-48 h-48 object-contain"
        />
      </motion.div>
      
      <motion.h1
        className="text-5xl font-bold text-foreground text-center mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Lantern
      </motion.h1>
      
      <motion.p
        className="text-lg text-muted-foreground text-center max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        The Neighborhood That Moves With You
      </motion.p>
    </motion.div>
  )
}
