import { css, SerializedStyles } from "@emotion/react"
import * as React from "react"
import { ActivityType } from "types/strava/enums"

const MAX_WIDTH_PX = 30000
const RESOLUTION_SCALING_FACTOR = 50000

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
export type CanvasPoint = { x: number; y: number }

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
    const routesStarted = React.useRef<Record<string, boolean>>({})

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

    const animateAddingPoints = async (
      points: Array<CanvasPoint>,
      duration: number,
      stepHandler: (points: Array<CanvasPoint>) => void
    ) => {
      const delay = (duration / points.length) * 0.8

      return new Promise<void>((resolve) => {
        let pointIndex = 0
        let lastPointAddedAtTime: number = performance.now()
        let lastAnimationFrame: number | null = null

        let step: FrameRequestCallback | null = null
        step = (timestamp: number) => {
          const timeDiff = timestamp - lastPointAddedAtTime
          const numPointsToRenderThisFrame = Math.ceil(timeDiff / delay)
          const pointsToRenderThisFrame = points
            .slice(pointIndex, pointIndex + numPointsToRenderThisFrame)
            .filter((point) => point != null)

          stepHandler(pointsToRenderThisFrame)

          pointIndex += numPointsToRenderThisFrame
          lastPointAddedAtTime = performance.now()

          if (pointIndex < points.length) {
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

        const canvasPoints = route.waypoints
          .filter(
            (_: any, i: number) =>
              i === 0 ||
              i % renderEveryNthPoint === 0 ||
              i === route.waypoints.length - 1
          )
          .map((point) =>
            coordinatesToBoundedCanvasPoint(point, routeContext, geoBounds)
          )

        // Have the line width be 1/1000 of canvas width times user-specified thickness multiplier
        routeContext.lineWidth = (routeContext.canvas.width / 1000) * thickness
        routeContext.lineCap = "round"
        routeContext.lineJoin = "round"
        routeContext.strokeStyle = pathColor

        if (animationDuration == null || Number(animationDuration) === 0) {
          // Start the path off by moving to the first point
          routeContext.moveTo(canvasPoints[0].x, canvasPoints[0].y)
          routeContext.beginPath()
          for (const point of canvasPoints.slice(1)) {
            routeContext.lineTo(point.x, point.y)
            routeContext.moveTo(point.x, point.y)
          }
          routeContext.stroke()
        } else {
          routeContext.moveTo(canvasPoints[0].x, canvasPoints[0].y)
          await animateAddingPoints(
            canvasPoints,
            animationDuration,
            (pointsToRenderThisFrame: Array<CanvasPoint>) => {
              routeContext.beginPath()
              for (const point of pointsToRenderThisFrame) {
                routeContext.lineTo(point.x, point.y)
                routeContext.moveTo(point.x, point.y)
              }
              routeContext.stroke()
            }
          )
        }
      }

      // Done drawing, clear the routesStarted set so next draw has a freshly empty set
      routesStarted.current = {}
      console.log(`Done rendering ${routesToRender.length} routes`)
    }

    // Re-render the routes if props have changed
    React.useEffect(() => {
      // Cancel all animation frames since the props may have changed mid-animation
      cancelPendingAnimationFrames()
      drawingInProgress.current = false
      // Pull out the routes that are within the geoBounds
      // const filteredRoutes = routes.filter(filterRoutesForGeoBounds(geoBounds));
      renderRoutes(routes).then(() => {
        console.log("executing then block")
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
