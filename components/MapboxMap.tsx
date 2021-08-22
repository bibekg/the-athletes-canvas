import mapboxgl from "mapbox-gl"
import * as React from "react"
import { GeoBounds } from "types/geo"
import Box from "./Box"

interface Props {
  width: string
  height: string
  initialCoordinateBounds: GeoBounds
  mapRef?: React.MutableRefObject<mapboxgl.Map | null>
  onMove: (coordianteBounds: GeoBounds) => void
}

const MapboxMap = ({
  width,
  height,
  mapRef,
  initialCoordinateBounds,
  onMove,
}: Props) => {
  const coordinateSelectionMapRef = React.useRef<mapboxgl.Map | null>(null)
  const coordinateSelectionMapContainerRef = React.useRef<HTMLDivElement | null>(
    null
  )

  React.useEffect(() => {
    if (
      coordinateSelectionMapRef.current ||
      coordinateSelectionMapContainerRef.current == null
    ) {
      // initialize coordinateSelectionMapRef only once and only if the container for it has already been rendered
      return
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string
    coordinateSelectionMapRef.current = new mapboxgl.Map({
      container: coordinateSelectionMapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      bounds: [
        [initialCoordinateBounds.west, initialCoordinateBounds.south],
        [initialCoordinateBounds.east, initialCoordinateBounds.north],
      ],
    })
    if (mapRef) {
      mapRef.current = coordinateSelectionMapRef.current
    }

    coordinateSelectionMapRef.current.on("move", () => {
      const map = coordinateSelectionMapRef.current!
      const bounds = map.getBounds()
      const west = bounds.getWest()
      const east = bounds.getEast()
      const north = bounds.getNorth()
      const south = bounds.getSouth()
      const boundsObject = { west, east, north, south }
      onMove(boundsObject)
    })
  })

  return (
    <Box
      ref={coordinateSelectionMapContainerRef}
      width={width}
      height={height}
    />
  )
}

export default MapboxMap
