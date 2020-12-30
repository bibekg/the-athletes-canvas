import { createHandler } from "utils/api"
import { authenticate } from "utils/api/strava"

export default createHandler(async (req, res) => {
  const { code } = req.query
  try {
    await authenticate(code as string, req, res)
    res.status(307).redirect("/")
  } catch (err) {
    if (err?.response?.status === 401) {
      res.status(401).end()
    } else {
      res.status(500).end()
    }
  }
})
