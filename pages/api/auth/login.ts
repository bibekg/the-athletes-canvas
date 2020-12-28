import { createHandler } from "utils/api";

const stravaClientId = process.env.STRAVA_CLIENT_ID;

// TODO: Add production uri once ready to deploy
const redirectUri = `http://localhost:3000/api/auth/strava-callback`;

export default createHandler((req, res) => {
  const queryParams = new URLSearchParams();
  queryParams.set("client_id", stravaClientId);
  queryParams.set("redirect_uri", redirectUri);
  queryParams.set("response_type", "code");
  queryParams.set("scope", ["activity:read_all"].join(","));
  res.status(307).redirect(`https://www.strava.com/oauth/authorize?${queryParams.toString()}`);
});
