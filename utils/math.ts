export const roundToPlaces = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places
