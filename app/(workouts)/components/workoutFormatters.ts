export const formatWorkoutDate = (dateString: string) => {
  const date = new Date(dateString);
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
};

export const formatWorkoutVolume = (volume: number) => {
  if (!volume) return '0KG';
  return `${Math.round(volume).toLocaleString('en-US')}KG`;
};
