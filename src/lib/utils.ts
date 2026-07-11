import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60) return 'zojuist'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m geleden`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}u geleden`
  return `${Math.floor(seconds / 86400)}d geleden`
}
