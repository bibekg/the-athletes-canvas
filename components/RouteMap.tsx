import { css, SerializedStyles } from "@emotion/react"
import * as React from "react"
import { roundToPlaces } from "utils/math"
import { Coords, GeoBounds, Route } from "types/geo"

const MAX_WIDTH_PX = 30000
const RESOLUTION_SCALING_FACTOR = 50000

const normalizeLat = (lat: number) => 90 - lat
const normalizeLon = (lon: number) => 180 + lon

// Normalizes coordinates to be lat in [0, 180], lon in [0, 360]
const normalizeCoordinates = ({ lat, lon }: Coords) => ({
  x: normalizeLon(lon),
  y: normalizeLat(lat),
})

// Determines where on the specified canvas a {lat, lon} pair corresponds to such that
// the canvas represents a window into canvasBounds
const coordinatesToBoundedCanvasPoint = (
  { lat, lon }: Coords,
  context: CanvasRenderingContext2D,
  geoBounds: GeoBounds
) => {
  const normalizedMinX = normalizeLon(geoBounds.leftLon)
  const normalizedMaxX = normalizeLon(geoBounds.rightLon)
  const normalizedMinY = normalizeLat(geoBounds.upperLat)
  const normalizedMaxY = normalizeLat(geoBounds.lowerLat)
  const xRange = normalizedMaxX - normalizedMinX
  const yRange = normalizedMaxY - normalizedMinY

  const normalizedCoords = normalizeCoordinates({ lat, lon })
  const xRelativeToBounds = (normalizedCoords.x - normalizedMinX) / xRange
  const yRelativeToBounds = (normalizedCoords.y - normalizedMinY) / yRange

  const canvas = context.canvas
  const x = Math.round(xRelativeToBounds * canvas.width)
  const y = Math.round(yRelativeToBounds * canvas.height)
  return { x, y }
}

const canvasPointToCoordinates = (
  { x, y }: { x: number; y: number },
  context: CanvasRenderingContext2D,
  geoBounds: GeoBounds
) => {
  const canvas = context.canvas
  const normalizedMinX = normalizeLon(geoBounds.leftLon)
  const normalizedMaxX = normalizeLon(geoBounds.rightLon)
  const normalizedMinY = normalizeLat(geoBounds.upperLat)
  const normalizedMaxY = normalizeLat(geoBounds.lowerLat)

  const xRange = normalizedMaxX - normalizedMinX
  const yRange = normalizedMaxY - normalizedMinY

  const lon = roundToPlaces(
    (x / canvas.width) * xRange + normalizedMinX - 180,
    4
  )
  const lat = roundToPlaces(
    90 - ((y / canvas.height) * yRange + normalizedMinY),
    4
  )

  return { lat, lon }
}

export type CanvasPoint = { x: number; y: number }

export interface BoundsDrawn {
  x: number
  y: number
  startX: number
  startY: number
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
  onBoundsDrawn?: (bounds: GeoBounds) => void
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
      onBoundsDrawn = undefined,
    }: Props,
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const canvasBoundsRef = React.useRef<HTMLDivElement | null>(null)
    const [isBounding, setIsBounding] = React.useState(false)
    const mouseRef = React.useRef<BoundsDrawn>({
      x: 0,
      y: 0,
      startX: 0,
      startY: 0,
    })
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

    const setMousePosition = (
      ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
      if (canvasRef.current == null) return
      const canvasBounds = canvasRef.current.getBoundingClientRect()
      mouseRef.current.x = ev.pageX - canvasBounds.left
      mouseRef.current.y = ev.pageY - canvasBounds.top
    }

    const handleMouseDown = (
      eventData: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
      if (eventData.button != 0) return
      const canvas = canvasRef.current
      const canvasBounds = canvasBoundsRef.current
      const mouse = mouseRef.current

      if (canvas == null || canvasBounds == null) return null

      mouse.startX = mouse.x
      mouse.startY = mouse.y
      canvasBounds.style.left = mouse.x + "px"
      canvasBounds.style.top = mouse.y + "px"
      setIsBounding(true)
    }

    const handleMouseUp = (
      eventData: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
      if (eventData.button != 0) return
      const canvas = canvasRef.current
      const canvasBounds = canvasBoundsRef.current
      const mouse = mouseRef.current

      if (canvas == null || canvasBounds == null) return null
      // End bounding
      if (onBoundsDrawn) {
        const canvasVisualBounds = canvas.getBoundingClientRect()
        const canvasScalingFactor = canvas.width / canvasVisualBounds.width
        const mouseTopLeftWithinCanvas = {
          x: Math.min(mouse.startX, mouse.x) * canvasScalingFactor,
          y: Math.min(mouse.startY, mouse.y) * canvasScalingFactor,
        }
        const mouseBottomRightWithinCanvas = {
          x: Math.max(mouse.startX, mouse.x) * canvasScalingFactor,
          y: Math.max(mouse.startY, mouse.y) * canvasScalingFactor,
        }

        const bottomRight = canvasPointToCoordinates(
          mouseBottomRightWithinCanvas,
          canvas.getContext("2d")!,
          geoBounds
        )
        const topLeft = canvasPointToCoordinates(
          mouseTopLeftWithinCanvas,
          canvas.getContext("2d")!,
          geoBounds
        )

        onBoundsDrawn({
          upperLat: topLeft.lat,
          lowerLat: bottomRight.lat,
          leftLon: topLeft.lon,
          rightLon: bottomRight.lon,
        })
      }

      setIsBounding(false)
      mouse.x = 0
      mouse.y = 0
    }

    const handleMouseMove = (
      event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
      setMousePosition(event)
      if (canvasBoundsRef.current !== null && isBounding) {
        const el = canvasBoundsRef.current
        const mouse = mouseRef.current
        el.style.width = Math.abs(mouse.x - mouse.startX) + "px"
        el.style.height = Math.abs(mouse.y - mouse.startY) + "px"
        el.style.left =
          mouse.x - mouse.startX < 0 ? mouse.x + "px" : mouse.startX + "px"
        el.style.top =
          mouse.y - mouse.startY < 0 ? mouse.y + "px" : mouse.startY + "px"
      }
    }

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
      const canvasContext = canvas.getContext("2d")

      // Create a new context to paint the bg with
      if (canvasContext == null) return null
      // Start with a blank canvas
      canvasContext.clearRect(0, 0, canvas.width, canvas.height)

      // Color the backround if one is specified
      if (bgColor) {
        canvasContext.fillStyle = bgColor
        canvasContext.fillRect(0, 0, canvas.width, canvas.height)
      }

      drawingInProgress.current = true

      for (const route of routesToRender) {
        if (canvasContext == null) return null

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
            coordinatesToBoundedCanvasPoint(point, canvasContext, geoBounds)
          )

        // Have the line width be 1/1000 of canvas width times user-specified thickness multiplier
        canvasContext.lineWidth =
          (canvasContext.canvas.width / 1000) * thickness
        canvasContext.lineCap = "round"
        canvasContext.lineJoin = "round"
        canvasContext.strokeStyle = pathColor

        if (animationDuration == null || Number(animationDuration) === 0) {
          // Start the path off by moving to the first point
          canvasContext.moveTo(canvasPoints[0].x, canvasPoints[0].y)
          canvasContext.beginPath()
          for (const point of canvasPoints.slice(1)) {
            canvasContext.lineTo(point.x, point.y)
            canvasContext.moveTo(point.x, point.y)
          }
          canvasContext.stroke()
        } else {
          canvasContext.moveTo(canvasPoints[0].x, canvasPoints[0].y)
          await animateAddingPoints(
            canvasPoints,
            animationDuration,
            (pointsToRenderThisFrame: Array<CanvasPoint>) => {
              canvasContext.beginPath()
              for (const point of pointsToRenderThisFrame) {
                canvasContext.lineTo(point.x, point.y)
                canvasContext.moveTo(point.x, point.y)
              }
              canvasContext.stroke()
            }
          )
        }
      }

      // Done drawing, clear the routesStarted set so next draw has a freshly empty set
      routesStarted.current = {}
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
      <div css={css({ position: "relative" })}>
        <canvas
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          css={css(canvasStyles, { position: "relative", cursor: "crosshair" })}
          ref={canvasRef}
          width={effectiveWidth}
          height={effectiveHeight}
        ></canvas>
        <div
          ref={canvasBoundsRef}
          css={css({
            position: "absolute",
            border: isBounding ? "1px dotted gray" : undefined,
            width: 0,
            height: 0,
            pointerEvents: "none",
          })}
        />
      </div>
    )
  }
)
