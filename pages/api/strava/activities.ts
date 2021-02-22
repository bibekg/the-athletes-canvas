import { createHandler } from "utils/api"
import axios from "axios"
import { ensureAuthenticated } from "utils/api/strava"

export default createHandler(async (req, res) => {
  const accessToken = req.cookies["X-Access-Token"]
  if (accessToken == null) {
    res.status(401).end()
    return
  }

  const fetchActivitiesAndRespondToClient = async () => {
    const allActivities: any[] = []

    for (let page = 1; true; page += 1) {
      const response = await axios({
        // https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
        url: "https://www.strava.com/api/v3/athlete/activities",
        params: {
          per_page: 200, // max allowed per page
          page,
        },
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        break
      } else {
        allActivities.push(...response.data)
      }
    }

    res.json({
      activities: allActivities,
    })
  }

  try {
    await fetchActivitiesAndRespondToClient()
  } catch (err) {
    if (err?.response?.status === 401) {
      // Try refreshing the token
      const refreshToken = req.cookies["X-Refresh-Token"]
      if (refreshToken == null) {
        res.status(401).end()
        return
      }

      try {
        await ensureAuthenticated(req, res)
        // Now try again
        await fetchActivitiesAndRespondToClient()
      } catch (err) {
        if (err?.response?.status === 401) {
          res.status(401).end()
          return
        }
      }
    } else {
      // Original request failed for unknown reason
      res.status(500).end()
      console.log(err.response.data.errors)
    }
  }
})
