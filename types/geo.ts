import { ActivityType } from "./strava/enums"

export interface GeoBounds {
  west: number
  east: number
  north: number
  south: number
}

export interface Coords {
  lat: number
  lon: number
}

export type Route = {
  id: any
  name: string
  startDate: string
  type: ActivityType
  waypoints: Array<Coords>
}
