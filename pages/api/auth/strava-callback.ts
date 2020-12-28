import { createHandler } from "utils/api";
import axios from "axios";
import Cookies from "cookies";

const stravaClientId = process.env.STRAVA_CLIENT_ID;
const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET;

export default createHandler(async (req, res) => {
  const { code } = req.query;

  let response = null;
  try {
    response = await axios({
      url: "https://www.strava.com/api/v3/oauth/token",
      method: "POST",
      data: {
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        code,
        grant_type: "authorization_code",
      },
      responseType: "json",
    });
  } catch (err) {
    console.log(err);
  }
  if (response == null || response.data == null) {
    return res.status(500).end();
  }
  const { access_token, refresh_token, athlete, expires_at } = response.data;

  const cookies = new Cookies(req, res);
  cookies.set("X-Access-Token", access_token, { httpOnly: true });
  cookies.set("X-Refresh-Token", refresh_token, { httpOnly: true });

  cookies.set("'X-Access-Token-Expires-At'", expires_at);
  cookies.set("X-Strava-Athlete-ID", athlete.id);
  res.status(307).redirect("/");
});
