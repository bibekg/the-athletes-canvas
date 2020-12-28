import axios from "axios";
import Cookies from "cookies";
import { createHandler } from "utils/api";

const stravaClientId = process.env.STRAVA_CLIENT_ID;
const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET;

export default createHandler(async (req, res) => {
  const accessToken = req.cookies["X-Access-Token"];
  const expiresAt = req.cookies["X-Access-Token-Expires-At"];
  const refreshToken = req.cookies["X-Refresh-Token"];

  // Check if access token is missing or will expire in the next minute
  if (accessToken == null || expiresAt == null || Number(expiresAt) - 60 <= Date.now() / 1000) {
    if (refreshToken == null) {
      // No refresh token present, redirect to login
      res.status(401).redirect("/api/auth/login");
      return;
    }

    const response = await axios({
      url: "https://www.strava.com/oauth/token",
      method: "POST",
      data: {
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
    });
    if (response == null || response.data == null) {
      return res.status(500).end();
    }
    const { access_token, refresh_token, athlete, expires_at } = response.data;

    const cookies = new Cookies(req, res);
    cookies.set("X-Access-Token", access_token, { httpOnly: true });
    cookies.set("X-Refresh-Token", refresh_token, { httpOnly: true });

    cookies.set("'X-Access-Token-Expires-At'", expires_at);
    cookies.set("X-Strava-Athlete-ID", athlete.id);
    res.status(200).end();
  } else {
    // Access token is valid
    res.status(200).end();
  }
});
