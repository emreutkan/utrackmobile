export const formatTimeRemaining = (hours: number): string => {
  if (hours <= 0) return 'Ready';
  if (hours < 1) return `${Math.ceil(hours * 60)}m`;
  if (hours < 24) return `${Math.ceil(hours)}h`;
  const days = Math.floor(hours / 24);
  const h = Math.ceil(hours % 24);
  return h > 0 ? `${days}d ${h}h` : `${days}d`;
};

export const getStatusColor = (pct: number) => {
  if (pct >= 90) return '#30D158'; // Green (Ready)
  if (pct >= 50) return '#FF9F0A'; // Orange (Recovering)
  return '#FF453A'; // Red (Fatigued)
};

export const MUSCLE_CATEGORIES = {
  Upper: [
    'chest',
    'shoulders',
    'biceps',
    'triceps',
    'forearms',
    'lats',
    'traps',
    'lower_back',
    'neck',
  ],
  Lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
  Core: ['abs', 'obliques'],
};

export const getCategory = (muscle: string) => {
  if (MUSCLE_CATEGORIES.Upper.includes(muscle)) return 'Upper Body';
  if (MUSCLE_CATEGORIES.Lower.includes(muscle)) return 'Lower Body';
  return 'Core';
};
