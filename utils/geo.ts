import { GeoBounds, Route } from "types/geo"
import { roundToPlaces } from "./math"

// The whole globe -- this might be unsafe since it'll make a gigantic canvas...
export const FALLBACK_GEO_BOUNDS: GeoBounds = {
  west: -180,
  east: 180,
  north: 90,
  south: -90,
}

// Determine the GeoBounds that will contain all the routes with a small padding (5%)
export const getGeoBoundsForRoutes = (
  routes: Array<Route>
): GeoBounds | null => {
  let minLat = 90
  let maxLat = -90
  let minLon = 180
  let maxLon = -180

  let somePointsExist = false
  routes.forEach((route) => {
    route.waypoints.forEach((waypoint) => {
      somePointsExist = true
      minLat = Math.min(waypoint.lat, minLat)
      maxLat = Math.max(waypoint.lat, maxLat)
      minLon = Math.min(waypoint.lon, minLon)
      maxLon = Math.max(waypoint.lon, maxLon)
    })
  })

  const latRange = Math.abs(maxLat - minLat)
  const lonRange = Math.abs(maxLon - minLon)
  const latBuffer = 0.05 * latRange
  const lonBuffer = 0.05 * lonRange

  return somePointsExist
    ? {
        west: roundToPlaces(minLon - lonBuffer, 4),
        east: roundToPlaces(maxLon + lonBuffer, 4),
        north: roundToPlaces(maxLat + latBuffer, 4),
        south: roundToPlaces(minLat - latBuffer, 4),
      }
    : null
}
