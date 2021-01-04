import { createHandler } from "utils/api"
import { ensureAuthenticated } from "utils/api/strava"

export default createHandler(async (req, res) => {
  try {
    await ensureAuthenticated(req, res)
    res.status(200).end()
  } catch (err) {
    if (err?.response?.status === 401) {
      res.status(401).end()
    } else {
      res.status(500).end()
    }
  }
})
