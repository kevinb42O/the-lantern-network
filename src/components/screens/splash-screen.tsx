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
        className="mb-6 relative"
      >
        {/* Glow effect layers */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-orange-400/30 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-yellow-300/40 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* The lantern image - bigger */}
        <img 
          src="/lantern-logo.png" 
          alt="Lantern Logo" 
          className="w-64 h-64 object-contain relative z-10 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]"
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
