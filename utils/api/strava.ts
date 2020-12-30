import axios, { AxiosResponse } from "axios"
import Cookies from "cookies"
import { NextApiRequest, NextApiResponse } from "next"
import { SummaryAthlete } from "types/strava"

const stravaClientId = process.env.STRAVA_CLIENT_ID
const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET

interface StravaOAuthResponseType {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  athlete: SummaryAthlete
}

export const reauthenticate = async (
  refreshToken: string,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const response: AxiosResponse<StravaOAuthResponseType> = await axios({
    url: "https://www.strava.com/api/v3/oauth/token",
    method: "POST",
    data: {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    },
    responseType: "json",
  })
  if (response == null || response.data == null) {
    throw new Error("oh no")
  }
  const cookies = new Cookies(req, res)
  cookies.set("X-Access-Token", response.data.access_token, {
    httpOnly: true,
  })
  cookies.set("X-Refresh-Token", response.data.refresh_token, {
    httpOnly: true,
  })

  cookies.set("'X-Access-Token-Expires-At'", String(response.data.expires_at))
}

export const authenticate = async (
  code: string,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const response: AxiosResponse<StravaOAuthResponseType> = await axios({
    url: "https://www.strava.com/api/v3/oauth/token",
    method: "POST",
    data: {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      code,
      grant_type: "authorization_code",
    },
    responseType: "json",
  })
  if (response == null || response.data == null) {
    throw new Error("oh no")
  }

  const cookies = new Cookies(req, res)
  cookies.set("X-Access-Token", response.data.access_token, {
    httpOnly: true,
  })
  cookies.set("X-Refresh-Token", response.data.refresh_token, {
    httpOnly: true,
  })

  cookies.set("'X-Access-Token-Expires-At'", String(response.data.expires_at))
  cookies.set("X-Strava-Athlete-ID", String(response.data.athlete.id))
}
