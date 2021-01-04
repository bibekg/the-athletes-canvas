import { ActivityType } from "./strava/enums"

export interface GeoBounds {
  leftLon: number
  rightLon: number
  upperLat: number
  lowerLat: number
}

export interface Coords {
  lat: number
  lon: number
}

export type Route = {
  id: any
  name: string
  startDate: Date
  type: ActivityType
  waypoints: Array<Coords>
}
