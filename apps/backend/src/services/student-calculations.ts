export function calculateWindowSize(weeklyFrequency: number): number {
  if (![3, 5].includes(weeklyFrequency)) {
    throw new Error('Weekly frequency must be 3 or 5')
  }
  return weeklyFrequency * 2
}
