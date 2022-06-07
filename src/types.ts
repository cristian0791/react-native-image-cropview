import { MutableRefObject } from 'react'
import { Animated, LayoutRectangle } from 'react-native'
import {
  GestureHandlerStateChangeNativeEvent,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler'

export type TranslationXY = { translationX: number; translationY: number }
export type FramesXY = { framesX: number; framesY: number }
export type ValueXY = { x: number; y: number }
export type ScaleFrame = { scaleFrame: number }
export type PositionLayout = {
  left: number
  top: number
  right: number
  bottom: number
}

export type CropBoxDoneEventProps = {
  focalX: number
  focalY: number
  translateX: number
  translateY: number
  scale: number
  x: number
  y: number
  width: number
  height: number
}

export type CropBoxHandler = {
  setImageLayout: (layout: PositionLayout) => void
  holdAnimations: () => void
  updateCropperToFitInsideContainer: (layout: LayoutRectangle) => void
  resetTo: ({
    top,
    left,
    right,
    bottom,
    containerLayout,
  }: PositionLayout & { containerLayout: LayoutRectangle }) => void
}

export type ImageHandler = {
  setCropboxLayout: (layout: LayoutRectangle) => void
  pinchToZoom: (props: CropBoxDoneEventProps) => void
  resetTo: (props: {
    x: number
    y: number
    scale: number
    width: number
    height: number
  }) => void
  getCropArea: () => LayoutRectangle
}

export type FooterHandler = {
  setDoneActive: (state: boolean) => void
  setResetActive: (state: boolean) => void
}

export type IndicatorHandler = {
  showGrid: (state: boolean) => void
}

export type CropperHandler = {
  done: () => void
  reset: () => void
  cancel: () => void
}

export type SharedValue = {
  value: MutableRefObject<number>
  animatedValue: MutableRefObject<Animated.Value>
  setAnimatedValue: (n: number) => void
  setValue: (n: number) => void
}

// eslint-disable-next-line no-shadow
export enum BoxHandlerTypes {
  None = 0,
  TopLeft = 1,
  TopRight = 2,
  BottomLeft = 3,
  BottomRight = 4,
  Top = 5,
  Left = 6,
  Right = 7,
  Bottom = 8,
}

export type NativeEvent = GestureHandlerStateChangeNativeEvent &
  PanGestureHandlerGestureEvent &
  PinchGestureHandlerGestureEvent

type ClampedBoxValues = { min: number; max: number }
type ClampedBoxValuesTypes =
  | 'leftvalues'
  | 'topvalues'
  | 'rightvalues'
  | 'bottomvalues'
export type ClampedValues = Record<ClampedBoxValuesTypes, ClampedBoxValues>

export type ScaleRange = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
