import React from "react"
import { SummaryActivity } from "types/strava"

export const useStravaData = () => {
  const [
    activities,
    setActivities,
  ] = React.useState<Array<SummaryActivity> | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const tryToFetchActivities = async () => {
      const result = await fetch("/api/strava/activities")
      if (result.ok) {
        const data = await result.json()
        if (data?.activities) {
          setActivities(data.activities)
        }
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
      }
    }
    tryToFetchActivities()
  }, [])

  return { activities, isLoggedIn }
}
