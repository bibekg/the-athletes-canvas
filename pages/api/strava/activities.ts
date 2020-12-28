import { createHandler } from "utils/api";
import axios from "axios";

export default createHandler(async (req, res) => {
  const accessToken = req.cookies["X-Access-Token"];
  if (accessToken == null) {
    res.status(401).end();
    return;
  }

  try {
    const response = await axios({
      url: "https://www.strava.com/api/v3/athlete/activities",
      params: {
        per_page: 200, // max allowed
        // after start of 2020
        after: new Date("2020-01-01T00:00:00.000Z").getTime() / 1000,
      },
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json({
      activities: response.data,
    });
  } catch (err) {
    if (err.response.status === 401) {
      res.status(401).end();
    } else {
      res.status(500).end();
      console.log(err.response.data.errors);
    }
  }
});
