import { css, SerializedStyles } from "@emotion/react"
import * as React from "react"
import { ActivityType } from "types/strava/enums"

const MAX_WIDTH_PX = 30000
const RESOLUTION_SCALING_FACTOR = 20000

const normalizeLat = (lat: number) => 90 - lat
const normalizeLon = (lon: number) => 180 + lon

interface Coords {
  lat: number
  lon: number
}

const normalizeCoordinates = ({ lat, lon }: Coords) => ({
  x: normalizeLon(lon),
  y: normalizeLat(lat),
})

export interface GeoBounds {
  leftLon: number
  rightLon: number
  upperLat: number
  lowerLat: number
}

// Determines where on the specified canvas a {lat, lon} pair corresponds to such that
// the canvas represents a window into canvasBounds
const coordinatesToBoundedCanvasPoint = (
  { lat, lon }: Coords,
  context: CanvasRenderingContext2D,
  geoBounds: GeoBounds
) => {
  const normalizedCoords = normalizeCoordinates({ lat, lon })
  const normalizedMinX = normalizeLon(geoBounds.leftLon)
  const normalizedMaxX = normalizeLon(geoBounds.rightLon)
  const normalizedMinY = normalizeLat(geoBounds.upperLat)
  const normalizedMaxY = normalizeLat(geoBounds.lowerLat)

  const xRange = normalizedMaxX - normalizedMinX
  const yRange = normalizedMaxY - normalizedMinY

  const xRelativeToBounds = (normalizedCoords.x - normalizedMinX) / xRange
  const yRelativeToBounds = (normalizedCoords.y - normalizedMinY) / yRange

  const canvas = context.canvas
  const x = Math.round(xRelativeToBounds * canvas.width)
  const y = Math.round(yRelativeToBounds * canvas.height)
  return { x, y }
}

export type Waypoint = Coords

export type Route = {
  id: any
  name: string
  startDate: Date
  type: ActivityType
  waypoints: Array<Waypoint>
}

export interface Resolution {
  width: number
  height: number
}

export type RouteMapDoneDrawingCallback = (info: {
  resolution: Resolution | null
}) => void

export interface Props {
  routes: Array<Route>
  geoBounds: GeoBounds
  pathResolution?: number
  animationDuration?: number
  thickness?: number
  // Pixels per degree
  mapResolution?: number
  bgColor?: string | null
  pathColor?: string
  canvasStyles?: SerializedStyles
  onDoneDrawing?: RouteMapDoneDrawingCallback
}

export interface RouteMapRef {
  cancelDrawing: () => void
}

export const RouteMap = React.forwardRef(
  (
    {
      routes,
      geoBounds,
      animationDuration = 750,
      thickness = 0.5,
      mapResolution = 0.5,
      pathResolution = 1,
      bgColor = null,
      pathColor = "rgb(0,0,0,0.25)",
      canvasStyles = css({}),
      onDoneDrawing = () => {},
    }: Props,
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    // const [drawingInProgress, setDrawingInProgress] = React.useState(false)
    const drawingInProgress = React.useRef(false)
    // A pretty big hammer -- may need to nuance this at some point
    const cancelPendingAnimationFrames = () => {
      for (var i = 1; i < 99999; i++) {
        window.clearInterval(i)
        window.cancelAnimationFrame(i)
      }
    }

    React.useImperativeHandle(
      ref,
      (): RouteMapRef => ({
        cancelDrawing: () => {
          drawingInProgress.current = false
          cancelPendingAnimationFrames()
        },
      })
    )

    const addPath = (
      from: Coords,
      to: Coords,
      context: CanvasRenderingContext2D
    ) => {
      const { x: fromX, y: fromY } = coordinatesToBoundedCanvasPoint(
        from,
        context,
        geoBounds
      )
      const { x: toX, y: toY } = coordinatesToBoundedCanvasPoint(
        to,
        context,
        geoBounds
      )

      // Have the line width be 1/1000 of canvas width times user-specified thickness multiplier
      context.lineWidth = (context.canvas.width / 1000) * thickness
      context.lineCap = "round"
      context.lineJoin = "round"
      context.strokeStyle = pathColor

      context.beginPath()
      context.moveTo(fromX, fromY)
      context.lineTo(toX, toY)
      context.stroke()
    }

    const animateRenderWaypoints = async (
      waypoints: Array<Waypoint>,
      context: CanvasRenderingContext2D
    ) => {
      const numPointsToRender = waypoints.length
      const delay = (animationDuration / numPointsToRender) * 0.8

      return new Promise<void>((resolve) => {
        let waypointIndex = 1
        let lastPointAddedAtTime: number | null = null
        let lastAnimationFrame: number | null = null

        let step: FrameRequestCallback | null = null
        step = (timestamp: number) => {
          // If this is the first time we're adding points for this id, just add 1
          if (lastPointAddedAtTime == null) {
            const wp = waypoints[waypointIndex]
            addPath(
              waypoints[waypointIndex - 1],
              waypoints[waypointIndex],
              context
            )
            waypointIndex += 1
            lastPointAddedAtTime = performance.now()
          } else {
            const timeDiff = timestamp - lastPointAddedAtTime
            if (timeDiff >= delay) {
              const numPointsToRenderThisFrame = Math.ceil(timeDiff / delay)
              for (let i = 0; i < numPointsToRenderThisFrame; i += 1) {
                const wp = waypoints[waypointIndex]
                if (wp) {
                  addPath(
                    waypoints[waypointIndex - 1],
                    waypoints[waypointIndex],
                    context
                  )
                  waypointIndex += 1
                  lastPointAddedAtTime = performance.now()
                }
              }
            }
          }

          if (waypointIndex < waypoints.length) {
            if (step && drawingInProgress.current)
              lastAnimationFrame = window.requestAnimationFrame(step)
          } else {
            if (lastAnimationFrame != null) {
              window.cancelAnimationFrame(lastAnimationFrame)
            }
            resolve()
          }
        }
        lastAnimationFrame = window.requestAnimationFrame(step)
      })
    }

    const renderRoutes = async (routesToRender: Array<Route>) => {
      const canvas = canvasRef.current
      if (canvas == null) return null

      // Create a new context to paint the bg with
      const bgContext = canvas.getContext("2d")
      if (bgContext == null) return null
      // Start with a blank canvas
      bgContext.clearRect(0, 0, canvas.width, canvas.height)

      // Color the backround if one is specified
      if (bgColor) {
        bgContext.fillStyle = bgColor
        bgContext.fillRect(0, 0, canvas.width, canvas.height)
      }

      drawingInProgress.current = true
      for (const route of routesToRender) {
        const routeContext = canvas.getContext("2d")
        if (routeContext == null) return null

        if (pathResolution <= 0 || pathResolution > 1) {
          throw new Error(
            `Invalid value for pathResolution: ${pathResolution}. Must be in the range (0, 1]`
          )
        }
        const renderEveryNthPoint = Math.ceil(1 / pathResolution)

        const waypointsToRender = route.waypoints.filter(
          (_: any, i: number) =>
            i === 0 ||
            i % renderEveryNthPoint === 0 ||
            i === route.waypoints.length - 1
        )

        if (animationDuration == null || Number(animationDuration) === 0) {
          // Even with a 0 animationDuration, it'll probably animate since it takes so long to plot all those points
          for (let i = 1; i < waypointsToRender.length; i += 1) {
            addPath(
              waypointsToRender[i - 1],
              waypointsToRender[i],
              routeContext
            )
          }
        } else {
          // Need to await here to make sure routes are rendered sequentially
          // Otherwise it'll kick off all routes' renderings ~simultaneously
          await animateRenderWaypoints(waypointsToRender, routeContext)
        }
      }
    }

    // Re-render the routes if props have changed
    React.useEffect(() => {
      // Cancel all animation frames since the props may have changed mid-animation
      cancelPendingAnimationFrames()
      drawingInProgress.current = false
      // Pull out the routes that are within the geoBounds
      // const filteredRoutes = routes.filter(filterRoutesForGeoBounds(geoBounds));
      renderRoutes(routes).then(() => {
        const canvas = canvasRef.current

        onDoneDrawing({
          resolution: canvas
            ? { width: canvas.width, height: canvas.height }
            : null,
        })
      })
    }, [
      routes,
      thickness,
      geoBounds,
      mapResolution,
      pathResolution,
      bgColor,
      pathColor,
      animationDuration,
      canvasRef,
    ])

    const widthInDegrees = Math.abs(geoBounds.leftLon - geoBounds.rightLon)
    const heightInDegrees = Math.abs(geoBounds.upperLat - geoBounds.lowerLat)
    const aspectRatio = widthInDegrees / heightInDegrees

    const effectiveWidth = Math.min(
      widthInDegrees * mapResolution * RESOLUTION_SCALING_FACTOR,
      MAX_WIDTH_PX
    )
    const effectiveHeight = effectiveWidth / aspectRatio

    return (
      <canvas
        css={css(canvasStyles)}
        ref={canvasRef}
        width={effectiveWidth}
        height={effectiveHeight}
      />
    )
  }
)
