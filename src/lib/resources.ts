/**
 * Resource type definitions and utilities for the mining game
 */

export type ResourceRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ResourceType {
  id: string;
  type: string; // 'crystal', 'gem', 'ore', 'artifact', 'energy'
  name: string;
  rarity: ResourceRarity;
  base_value: number; // in lanterns
  icon: string;
  description: string;
  spawn_weight: number;
}

export interface WorldResource {
  id: string;
  resource_type_id: string;
  location: { lat: number; lng: number };
  spawned_at: string;
  expires_at: string;
  mined_by: string | null;
  mined_at: string | null;
  is_active: boolean;
  // Joined resource type data
  resource_type?: ResourceType;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  resource_type_id: string;
  quantity: number;
  acquired_at: string;
  // Joined resource type data
  resource_type?: ResourceType;
}

/**
 * Rarity configuration with colors and spawn rates
 */
export const RARITY_CONFIG: Record<ResourceRarity, {
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  spawnChance: number; // percentage
  miningTimeMs: number;
  xpReward: number;
  lifespanHours: number;
}> = {
  common: {
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-400/30',
    glowColor: 'rgba(156, 163, 175, 0.5)',
    spawnChance: 60,
    miningTimeMs: 2000,
    xpReward: 10,
    lifespanHours: 4
  },
  uncommon: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-400/30',
    glowColor: 'rgba(74, 222, 128, 0.5)',
    spawnChance: 25,
    miningTimeMs: 2500,
    xpReward: 25,
    lifespanHours: 3
  },
  rare: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400/30',
    glowColor: 'rgba(96, 165, 250, 0.6)',
    spawnChance: 10,
    miningTimeMs: 3000,
    xpReward: 50,
    lifespanHours: 2
  },
  epic: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-400/30',
    glowColor: 'rgba(192, 132, 252, 0.7)',
    spawnChance: 4,
    miningTimeMs: 4000,
    xpReward: 100,
    lifespanHours: 1.5
  },
  legendary: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-400/30',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    spawnChance: 1,
    miningTimeMs: 5000,
    xpReward: 250,
    lifespanHours: 1
  }
};

/**
 * Get rarity based on weighted random selection
 */
export function getRandomRarity(): ResourceRarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    cumulative += config.spawnChance;
    if (roll < cumulative) {
      return rarity as ResourceRarity;
    }
  }
  
  return 'common';
}

/**
 * Calculate expiry time based on rarity
 */
export function calculateExpiryTime(rarity: ResourceRarity): Date {
  const lifespanHours = RARITY_CONFIG[rarity].lifespanHours;
  const expiryTime = new Date();
  expiryTime.setTime(expiryTime.getTime() + lifespanHours * 60 * 60 * 1000);
  return expiryTime;
}

/**
 * Get XP required for next mining level
 */
export function getXpForLevel(level: number): number {
  return level * 100; // Simple progression: level 1 = 100xp, level 2 = 200xp, etc.
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(xp: number): number {
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired + getXpForLevel(level) <= xp) {
    xpRequired += getXpForLevel(level);
    level++;
  }
  
  return level;
}

/**
 * Get XP progress within current level
 */
export function getXpProgress(xp: number): { current: number; required: number; percentage: number } {
  const level = getLevelFromXp(xp);
  let xpForPreviousLevels = 0;
  
  for (let i = 1; i < level; i++) {
    xpForPreviousLevels += getXpForLevel(i);
  }
  
  const currentLevelXp = xp - xpForPreviousLevels;
  const requiredXp = getXpForLevel(level);
  
  return {
    current: currentLevelXp,
    required: requiredXp,
    percentage: (currentLevelXp / requiredXp) * 100
  };
}

/**
 * Max resources that can spawn near a user
 */
export const MAX_RESOURCES_PER_USER = 15;

/**
 * Min/Max resources to spawn at once
 */
export const MIN_SPAWN_COUNT = 10;
export const MAX_SPAWN_COUNT = 20;
