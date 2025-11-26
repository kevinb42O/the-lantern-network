import { Coins } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background px-6"
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
      >
        <Coins 
          size={80} 
          weight="duotone" 
          className="text-primary lantern-glow mb-8" 
        />
      </motion.div>
      
      <motion.h1
        className="text-4xl font-bold text-foreground text-center mb-4"
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
