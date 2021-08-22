import { ActivityType } from "types/strava/enums"
import { decode } from "@mapbox/polyline"
import { SummaryActivity } from "types/strava"
import { Route } from "types/geo"

export const activityTypeEmojis = {
  [ActivityType.AlpineSki]: "⛷",
  [ActivityType.BackcountrySki]: "⛷",
  [ActivityType.Canoeing]: "🚣",
  [ActivityType.Crossfit]: "💪",
  [ActivityType.EBikeRide]: "🚴🏻",
  [ActivityType.Elliptical]: "🚴🏻",
  [ActivityType.Hike]: "🥾",
  [ActivityType.IceSkate]: "⛸",
  [ActivityType.InlineSkate]: "🛼",
  [ActivityType.Kayaking]: "🚣",
  [ActivityType.Kitesurf]: "🪁",
  [ActivityType.NordicSki]: "⛷",
  [ActivityType.Ride]: "🚴🏻",
  [ActivityType.RockClimbing]: "🧗",
  [ActivityType.RollerSki]: "⛷",
  [ActivityType.Rowing]: "🚣",
  [ActivityType.Run]: "🏃",
  [ActivityType.Snowboard]: "🏂",
  [ActivityType.Snowshoe]: "🎿",
  [ActivityType.StairStepper]: "🪜",
  [ActivityType.StandUpPaddling]: "🧍",
  [ActivityType.Surfing]: "🏄",
  [ActivityType.Swim]: "🏊",
  [ActivityType.VirtualRide]: "📀",
  [ActivityType.Walk]: "🚶",
  [ActivityType.WeightTraining]: "🏋️",
  [ActivityType.Windsurf]: "🏄",
  [ActivityType.Workout]: "🏋️",
  [ActivityType.Yoga]: "🧘",
}

export const activitiesToRoutes = (
  activities: Array<SummaryActivity>,
  activityFilterPredicate?: (activity: SummaryActivity) => boolean
): Array<Route> => {
  const filteredActivities = activityFilterPredicate
    ? activities.filter(activityFilterPredicate)
    : activities

  return filteredActivities.reduce<Array<Route>>((arr, activity) => {
    if (activity.map.summary_polyline) {
      arr.push({
        id: activity.id,
        name: activity.name,
        startDate: activity.start_date,
        type: activity.type,
        waypoints: decode(activity.map.summary_polyline).map(([lat, lon]) => ({
          lat,
          lon,
        })),
      })
    }
    return arr
  }, [])
}
