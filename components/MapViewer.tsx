import { css } from "@emotion/react";
import { ChromePicker, RGBColor } from "react-color";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import * as Form from "components/Form";
import * as Text from "components/Text";
import Box from "components/Box";
import { RouteMap, GeoBounds, Route, Props as RouteMapProps } from "components/RouteMap";
import Button from "components/Button";

const makeColorString = (color: RGBColor) => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

interface CustomizationOptions extends GeoBounds {
  thickness: number;
  duration: number;
  mapResolution: number;
  pathResolution: number;
  bgColor: RGBColor | null;
  pathColor: RGBColor;
}

const createPropsToPass = (options: CustomizationOptions): Partial<RouteMapProps> => {
  return {
    duration: options.duration,
    geoBounds: {
      leftLon: options.leftLon,
      rightLon: options.rightLon,
      upperLat: options.upperLat,
      lowerLat: options.lowerLat,
    },
    thickness: options.thickness,
    pathResolution: options.pathResolution,
    mapResolution: options.mapResolution,
    bgColor: options.bgColor ? makeColorString(options.bgColor) : null,
    pathColor: makeColorString(options.pathColor),
  };
};

interface Props {
  routes: Array<Route>;
}

export const MapViewer = ({ routes }: Props) => {
  const defaultValues: CustomizationOptions = {
    duration: 0,
    thickness: 5,
    mapResolution: 5000,
    pathResolution: 0.5,
    bgColor: { r: 0, g: 0, b: 0, a: 1 },
    pathColor: { r: 255, g: 255, b: 255, a: 0.2 },
    leftLon: -122.7,
    rightLon: -121.7,
    upperLat: 38,
    lowerLat: 37.46,
  };
  const { register, watch, control, handleSubmit } = useForm<CustomizationOptions>({
    mode: "onBlur",
    defaultValues,
  });

  const [propsToPass, setPropsToPass] = React.useState<Partial<RouteMapProps>>(
    createPropsToPass(defaultValues),
  );

  const values = watch();

  const onSubmit = (data: CustomizationOptions) => {
    const newProps = createPropsToPass(data);
    setPropsToPass(newProps);
  };

  return (
    <Form.Form onSubmit={handleSubmit(onSubmit)}>
      <Box display="flex">
        {/* Options */}
        <Box
          display="grid"
          gridTemplateColumns="1fr"
          gridTemplateRows="auto"
          placeContent="start"
          gridRowGap={4}
          width="500px"
          flexShrink={0}
          flexGrow={0}
          p={3}
          height="100vh"
          bg="#333"
          overflowY="auto"
        >
          <Text.SectionHeader color="white">Options</Text.SectionHeader>
          <Box>
            <Button mb={1} type="submit">
              Re-render map
            </Button>
          </Box>
          <Form.Item>
            <Form.Label>Animation Duration (ms, per activity)</Form.Label>
            <Form.Input
              name="duration"
              type="number"
              ref={register({ valueAsNumber: true })}
              min={0}
              max={3000}
            />
          </Form.Item>
          <Form.Item>
            <Form.Label>Line Thickness</Form.Label>
            <Form.Input
              name="thickness"
              type="range"
              ref={register({ valueAsNumber: true })}
              min={1}
              max={20}
            />
          </Form.Item>
          <Form.Item>
            <Form.Label>Map Resolution</Form.Label>
            <Form.Input
              name="mapResolution"
              type="range"
              ref={register({ valueAsNumber: true })}
              min={100}
              max={100000}
              step={100}
            />
          </Form.Item>
          <Form.Item>
            <Form.Label>Path Resolution</Form.Label>
            <Form.Input
              name="pathResolution"
              type="number"
              ref={register({ valueAsNumber: true })}
              min={0.1}
              max={1.0}
              step={0.1}
            />
          </Form.Item>
          <Box display="flex">
            <Form.Item mr={3}>
              <Form.Label>Bg Color</Form.Label>
              <Controller
                name="bgColor"
                control={control}
                render={(props) => (
                  <ChromePicker
                    color={props.value ?? undefined}
                    onChange={(color) => props.onChange(color.rgb)}
                  />
                )} // props contains: onChange, onBlur and value
              />
            </Form.Item>
            <Form.Item>
              <Form.Label>Path Color</Form.Label>
              {/* <Form.Input name="pathColor" type="color" ref={register()} /> */}
              <Controller
                name="pathColor"
                control={control}
                render={(props) => (
                  <ChromePicker
                    color={props.value}
                    onChange={(color) => props.onChange(color.rgb)}
                  />
                )} // props contains: onChange, onBlur and value
              />
            </Form.Item>
          </Box>

          <Box display="flex">
            <Form.Item flexGrow={1} mr={3}>
              <Form.Label>Left Longituide</Form.Label>
              <Form.Input
                name="leftLon"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={-180}
                max={values.rightLon}
                step="any"
              />
            </Form.Item>
            <Form.Item flexGrow={1}>
              <Form.Label>Right Longituide</Form.Label>
              <Form.Input
                name="rightLon"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={values.leftLon}
                max={180}
                step="any"
              />
            </Form.Item>
          </Box>
          <Box display="flex">
            <Form.Item flexGrow={1} mr={3}>
              <Form.Label>Upper Latitude</Form.Label>
              <Form.Input
                name="upperLat"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={values.lowerLat}
                max={90}
                step="any"
              />
            </Form.Item>
            <Form.Item flexGrow={1}>
              <Form.Label>Lower Latitude</Form.Label>
              <Form.Input
                name="lowerLat"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={-90}
                max={values.upperLat}
                step="any"
              />
            </Form.Item>
          </Box>
        </Box>

        <Box
          gridArea="map"
          flexGrow={0}
          height="100vh"
          display="flex"
          justifyContent="center"
          alignItems="center"
          p={1}
          bg={propsToPass.bgColor}
        >
          <RouteMap
            routes={routes}
            {...propsToPass}
            canvasStyles={css({
              maxHeight: "100%",
              maxWidth: "100%",
            })}
          />
        </Box>
      </Box>
    </Form.Form>
  );
};
