import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  LayoutRectangle,
  View,
} from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'

import { animationConfig, borderWidth, cornerSize } from '../../config'
import {
  useGestureEvent,
  usePanTranslationFrame,
  useSharedValue,
  useTimeout,
} from '../../hooks'
import styles from '../../styles'
import {
  BoxHandlerTypes,
  ClampedValues,
  CropBoxDoneEventProps,
  CropBoxHandler,
  IndicatorHandler,
  PositionLayout,
} from '../../types'
import { clamp, getMinCropperSize, resize } from '../../utils'
import Indicators from './indicators'
import Overlay from './overlay'

interface CropBoxProps {
  onCropBoxDone: (p: CropBoxDoneEventProps) => void
  updateImageBounderies: (p: LayoutRectangle) => void
  cropBoxRefs: Array<React.Ref<any>>
  lockedAspectRatio: boolean
  rounded?: boolean
  backgroundColor: string
  gridColor: string
}

const CropBox: ForwardRefRenderFunction<CropBoxHandler, CropBoxProps> = (
  {
    onCropBoxDone,
    updateImageBounderies,
    cropBoxRefs,
    lockedAspectRatio,
    rounded,
    backgroundColor,
    gridColor,
  },
  ref
) => {
  // Using state for the screen sizes to rerender the sizes of the backdrop
  // const [screen, setScreen] = useState(Dimensions.get("screen"));
  // Keep only one active handler at time
  const [activeHandler, setActiveHandler] = useState<BoxHandlerTypes>(
    BoxHandlerTypes.None
  )
  const [render, rerender] = useState(false)

  // Pan gesture handler hitslop
  const hitSlop = { top: 15, left: 15, right: 15, bottom: 15 }

  // Container layout - updates everytime when layout changes
  const containerLayout = useRef<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  // Position of the image in the container
  const imageLayout = useRef<PositionLayout>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  })

  // Minimum cropbox resize size.
  // Updates when layout changes based on width and height of the device
  const minCropperBoxSize = useRef({ width: 0, height: 0 })

  // Aspect ratio of cropbox rectangle.
  // Is set everytime when the cropbox is initiated
  const aspectRatio = useRef(1)

  // Keep the initial sizes to calculate the aspect ratio fit
  // when we need to keep de aspect ratio of crop area
  const initialCropperSize = useRef({ width: 0, height: 0 })

  const indicatorsRef = useRef<IndicatorHandler>(null)

  useImperativeHandle(ref, () => ({
    setImageLayout: ({ left, top, right, bottom }: PositionLayout) => {
      imageLayout.current = {
        left: Math.max(left, 0),
        top: Math.max(top, 0),
        right: Math.min(right, containerLayout.current.width),
        bottom: Math.min(bottom, containerLayout.current.height),
      }
    },
    holdAnimations: () => {
      resetCropperAnimationTimer()
    },
    updateCropperToFitInsideContainer: (
      containerLayoutMeasures: LayoutRectangle
    ) => {
      containerLayout.current = containerLayoutMeasures

      minCropperBoxSize.current = getMinCropperSize({
        ...Dimensions.get('screen'),
        ratio: aspectRatio.current,
      })

      scaleRectangleAndFitIntoPosition()
    },
    resetTo: (props) => {
      containerLayout.current = props.containerLayout

      top.setAnimatedValue(props.top)
      left.setAnimatedValue(props.left)
      right.setAnimatedValue(props.right)
      bottom.setAnimatedValue(props.bottom)

      top.setValue(props.top)
      left.setValue(props.left)
      right.setValue(props.right)
      bottom.setValue(props.bottom)

      if (lockedAspectRatio) {
        aspectRatio.current =
          (props.right - props.left) / (props.bottom - props.top) // width / height
      }

      minCropperBoxSize.current = getMinCropperSize({
        ...Dimensions.get('screen'),
        ratio: aspectRatio.current,
      })

      initialCropperSize.current = {
        width: props.right - props.left,
        height: props.bottom - props.top,
      }

      rerender(!render)
    },
  }))

  // Used to calculate every frame on pan gesture handler
  // Note: To handler multiple pan gesture in the same time, create differet "usePanTranslationFrame"
  // for every pan handler event
  const [panTranslationFrame, resetPanTranslationFrame] =
    usePanTranslationFrame()

  // Position in the screen for the cropbox.
  const [top] = useSharedValue(imageLayout.current.top)
  const [left] = useSharedValue(imageLayout.current.left)

  const [right] = useSharedValue(imageLayout.current.right)
  const [bottom] = useSharedValue(imageLayout.current.bottom)

  // To have the right interpolation values updated in the view,
  // after any change, the view is rerendered.
  const opacityAnimation = useRef(new Animated.Value(0))
  const [
    cropperAnimationsTimer,
    clearCropperAnimationsTimer,
    resetCropperAnimationTimer,
  ] = useTimeout(2000)

  const getClmpedValues = ({
    movingTop,
    movingLeft,
    movingRight,
    movingBottom,
  }: {
    movingTop?: boolean
    movingLeft?: boolean
    movingRight?: boolean
    movingBottom?: boolean
  }): ClampedValues => {
    if (!lockedAspectRatio) {
      return {
        leftvalues: {
          min: imageLayout.current.left,
          max: right.value.current - minCropperBoxSize.current.width,
        },
        topvalues: {
          min: imageLayout.current.top,
          max: bottom.value.current - minCropperBoxSize.current.height,
        },
        bottomvalues: {
          min: top.value.current + minCropperBoxSize.current.height,
          max: imageLayout.current.bottom,
        },
        rightvalues: {
          min: left.value.current + minCropperBoxSize.current.width,
          max: imageLayout.current.right,
        },
      }
    }

    const minTopValue = Math.max(imageLayout.current.top, top.value.current)
    const minLeftValue = Math.max(imageLayout.current.left, left.value.current)
    const minRightValue = Math.min(
      imageLayout.current.right,
      right.value.current
    )
    const minBottomValue = Math.min(
      imageLayout.current.bottom,
      bottom.value.current
    )

    var currentWidth = 0
    var currentHeight = 0

    if (movingTop) {
      currentHeight = bottom.value.current - minTopValue
    }

    if (movingBottom) {
      currentHeight = minBottomValue - top.value.current
    }

    if (movingLeft) {
      currentWidth = right.value.current - minLeftValue
    }

    if (movingRight) {
      currentWidth = minRightValue - left.value.current
    }

    if (currentWidth === 0 || currentHeight === 0) {
      console.error(
        'Something went wrong with the current width and height clamp calculations. Check getClmpedValues() function'
      )
    }

    // get the new minimum sizes for the cropper
    const resizedWidth = Math.max(
      Math.max(
        (currentHeight * initialCropperSize.current.width) /
          initialCropperSize.current.height,
        minCropperBoxSize.current.width
      ),
      minCropperBoxSize.current.width
    )

    const resizedHeight = Math.max(
      Math.max(
        (currentWidth * initialCropperSize.current.height) /
          initialCropperSize.current.width,
        minCropperBoxSize.current.height
      ),
      minCropperBoxSize.current.height
    )

    const minTranslationTop = Math.max(
      bottom.value.current - resizedHeight,
      imageLayout.current.top
    )

    const maxTranslationBottom = Math.min(
      Math.max(
        top.value.current + resizedHeight,
        top.value.current + minCropperBoxSize.current.height
      ),
      imageLayout.current.bottom
    )

    const minTranslationLeft = Math.max(
      right.value.current - resizedWidth,
      imageLayout.current.left
    )

    const maxTranslationRight = Math.min(
      Math.max(
        left.value.current + resizedWidth,
        left.value.current + minCropperBoxSize.current.width
      ),
      imageLayout.current.right
    )

    return {
      leftvalues: {
        min: minTranslationLeft,
        max: right.value.current - minCropperBoxSize.current.width,
      },
      topvalues: {
        min: minTranslationTop,
        max: bottom.value.current - minCropperBoxSize.current.height,
      },
      bottomvalues: {
        min: top.value.current + minCropperBoxSize.current.height,
        max: maxTranslationBottom,
      },
      rightvalues: {
        min: left.value.current + minCropperBoxSize.current.width,
        max: maxTranslationRight,
      },
    }
  }

  const onTopLeftCornerGestureEvent = useGestureEvent((event) => {
    const { state, translationX, translationY } = event.nativeEvent

    const { framesX, framesY } = panTranslationFrame({
      translationX,
      translationY,
    })

    let nextX = left.value.current
    let nextY = top.value.current

    if (lockedAspectRatio) {
      if (Math.abs(translationX) > Math.abs(translationY)) {
        nextX += framesX
        nextY += framesX / aspectRatio.current
      } else {
        nextX += framesY * aspectRatio.current
        nextY += framesY
      }
    } else {
      nextX += framesX
      nextY += framesY
    }

    const { leftvalues, topvalues } = getClmpedValues({
      movingTop: true,
      movingLeft: true,
    })

    let tx = clamp({
      value: nextX,
      minValue: leftvalues.min,
      maxValue: leftvalues.max,
    })

    let ty = clamp({
      value: nextY,
      minValue: topvalues.min,
      maxValue: topvalues.max,
    })

    if (state === State.ACTIVE) {
      top.setAnimatedValue(ty)
      top.setValue(nextY)

      left.setAnimatedValue(tx)
      left.setValue(nextX)
    } else if (state === State.END) {
      top.setValue(ty)
      left.setValue(tx)

      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.TopLeft)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onTopRightCornerGestureEvent = useGestureEvent((event) => {
    const { state, translationX, translationY } = event.nativeEvent
    const { framesX, framesY } = panTranslationFrame({
      translationX,
      translationY,
    })

    let nextX = right.value.current
    let nextY = top.value.current

    if (lockedAspectRatio) {
      if (Math.abs(translationX) > Math.abs(translationY)) {
        nextX += framesX
        nextY += (framesX / aspectRatio.current) * -1
      } else {
        nextX += framesY * aspectRatio.current * -1
        nextY += framesY
      }
    } else {
      nextX += framesX
      nextY += framesY
    }

    const { rightvalues, topvalues } = getClmpedValues({
      movingTop: true,
      movingRight: true,
    })

    const tx = clamp({
      value: nextX,
      minValue: rightvalues.min,
      maxValue: rightvalues.max,
    })

    const ty = clamp({
      value: nextY,
      minValue: topvalues.min,
      maxValue: topvalues.max,
    })

    if (state === State.ACTIVE) {
      top.setAnimatedValue(ty)
      top.setValue(nextY)

      right.setAnimatedValue(tx)
      right.setValue(nextX)
    } else if (state === State.END) {
      top.setValue(ty)
      right.setValue(tx)

      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.TopRight)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onBottomLeftCornerGestureEvent = useGestureEvent((event) => {
    const { translationX, translationY, state } = event.nativeEvent
    const { framesX, framesY } = panTranslationFrame({
      translationX,
      translationY,
    })

    let nextX = left.value.current
    let nextY = bottom.value.current

    if (lockedAspectRatio) {
      if (Math.abs(translationX) > Math.abs(translationY)) {
        nextX += framesX
        nextY += (framesX / aspectRatio.current) * -1
      } else {
        nextX += framesY * aspectRatio.current * -1
        nextY += framesY
      }
    } else {
      nextX += framesX
      nextY += framesY
    }

    const { bottomvalues, leftvalues } = getClmpedValues({
      movingBottom: true,
      movingLeft: true,
    })

    const tx = clamp({
      value: nextX,
      minValue: leftvalues.min,
      maxValue: leftvalues.max,
    })

    const ty = clamp({
      value: nextY,
      minValue: bottomvalues.min,
      maxValue: bottomvalues.max,
    })

    if (state === State.ACTIVE) {
      bottom.setAnimatedValue(ty)
      bottom.setValue(nextY)

      left.setAnimatedValue(tx)
      left.setValue(nextX)
    } else if (state === State.END) {
      bottom.setValue(ty)
      left.setValue(tx)

      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.BottomLeft)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onBottomRightCornerGestureEvent = useGestureEvent((event) => {
    const { translationX, translationY, state } = event.nativeEvent
    const { framesX, framesY } = panTranslationFrame({
      translationX,
      translationY,
    })

    let nextX = right.value.current
    let nextY = bottom.value.current

    if (lockedAspectRatio) {
      if (Math.abs(translationX) > Math.abs(translationY)) {
        nextX += framesX
        nextY += framesX / aspectRatio.current
      } else {
        nextX += framesY * aspectRatio.current
        nextY += framesY
      }
    } else {
      nextX += framesX
      nextY += framesY
    }

    const { bottomvalues, rightvalues } = getClmpedValues({
      movingBottom: true,
      movingRight: true,
    })

    const tx = clamp({
      value: nextX,
      minValue: rightvalues.min,
      maxValue: rightvalues.max,
    })

    const ty = clamp({
      value: nextY,
      minValue: bottomvalues.min,
      maxValue: bottomvalues.max,
    })

    if (state === State.ACTIVE) {
      bottom.setAnimatedValue(ty)
      bottom.setValue(nextY)

      right.setAnimatedValue(tx)
      right.setValue(nextX)
    } else if (state === State.END) {
      bottom.setValue(ty)
      right.setValue(tx)

      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.BottomRight)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onTopBarGestureEvent = useGestureEvent((event) => {
    const { translationX, translationY, state } = event.nativeEvent
    const { framesY } = panTranslationFrame({ translationX, translationY })

    const nextY = top.value.current + framesY
    const { topvalues } = getClmpedValues({ movingTop: true })

    const ty = clamp({
      value: nextY,
      minValue: topvalues.min,
      maxValue: topvalues.max,
    })

    if (state === State.ACTIVE) {
      top.setAnimatedValue(ty)
      top.setValue(nextY)
    } else if (state === State.END) {
      top.setValue(ty)
      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.Top)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onBottomBarGestureEvent = useGestureEvent((event) => {
    const { translationX, translationY, state } = event.nativeEvent
    const { framesY } = panTranslationFrame({ translationX, translationY })

    const nextY = bottom.value.current + framesY
    const { bottomvalues } = getClmpedValues({ movingBottom: true })

    const ty = clamp({
      value: nextY,
      minValue: bottomvalues.min,
      maxValue: bottomvalues.max,
    })

    if (state === State.ACTIVE) {
      bottom.setAnimatedValue(ty)
      bottom.setValue(nextY)
    } else if (state === State.END) {
      bottom.setValue(ty)
      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.Bottom)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onLeftBarGestureEvent = useGestureEvent((event) => {
    const { translationX, translationY, state } = event.nativeEvent
    const { framesX } = panTranslationFrame({ translationX, translationY })

    const nextX = left.value.current + framesX
    const { leftvalues } = getClmpedValues({ movingLeft: true })

    const tx = clamp({
      value: nextX,
      minValue: leftvalues.min,
      maxValue: leftvalues.max,
    })

    if (state === State.ACTIVE) {
      left.setAnimatedValue(tx)
      left.setValue(nextX)
    } else if (state === State.END) {
      left.setValue(tx)
      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.Left)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  const onRightBarGestureEvent = useGestureEvent((event) => {
    const { translationX, translationY, state } = event.nativeEvent
    const { framesX } = panTranslationFrame({ translationX, translationY })

    const nextX = right.value.current + framesX
    const { rightvalues } = getClmpedValues({ movingRight: true })

    const tx = clamp({
      value: nextX,
      minValue: rightvalues.min,
      maxValue: rightvalues.max,
    })

    if (state === State.ACTIVE) {
      right.setAnimatedValue(tx)
      right.setValue(nextX)
    } else if (state === State.END) {
      right.setValue(tx)

      resetPanTranslationFrame()
      onDragHandlerEnd()
    } else if (state === State.BEGAN) {
      setActiveHandler(BoxHandlerTypes.Right)
      onDragHandlerStart()
    } else if (state === State.CANCELLED) {
      onDragHandlerCanceled()
    } else if (state === State.FAILED) {
      onDragHandlerFailed()
    }
  })

  /** Start animations for the backdrop */
  const animateBackdropToOpaque = () => {
    opacityAnimation.current.stopAnimation()

    Animated.timing(opacityAnimation.current, {
      toValue: 0,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start()
  }

  const animateBackdropToTransparent = () => {
    opacityAnimation.current.stopAnimation()

    Animated.timing(opacityAnimation.current, {
      toValue: 1,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start()
  }
  /** End animations for backdrop */

  const getCurrentBoxBounderies = () => {
    return {
      width: right.value.current - left.value.current,
      height: bottom.value.current - top.value.current,
      x: left.value.current,
      y: top.value.current,
    }
  }

  const getNextBoxBounderies = () => {
    const boxWidth = right.value.current - left.value.current
    const boxHeight = bottom.value.current - top.value.current

    const resizedBoxRectangle = resize({
      containerWidth: containerLayout.current.width,
      containerHeight: containerLayout.current.height,
      width: boxWidth,
      height: boxHeight,
    })

    const x = (containerLayout.current.width - resizedBoxRectangle.width) / 2
    const y = (containerLayout.current.height - resizedBoxRectangle.height) / 2

    const focalX = left.value.current + boxWidth / 2
    const focalY = top.value.current + boxHeight / 2

    const newFocalX = x + resizedBoxRectangle.width / 2
    const newFocalY = y + resizedBoxRectangle.height / 2

    const translateX = newFocalX - focalX
    const translateY = newFocalY - focalY

    return {
      x,
      y,
      width: resizedBoxRectangle.width,
      height: resizedBoxRectangle.height,
      scale: resizedBoxRectangle.scale,
      focalX,
      focalY,
      translateX,
      translateY,
    }
  }

  const scaleRectangleAndFitIntoPosition = () => {
    const {
      width,
      height,
      x,
      y,
      scale,
      focalX,
      focalY,
      translateX,
      translateY,
    } = getNextBoxBounderies()

    onCropBoxDone({
      width,
      height,
      x,
      y,
      scale,
      focalX,
      focalY,
      translateX,
      translateY,
    })

    const topBarNextPosition = y
    const leftBarNextPosition = x

    const bottomBarNextPosition = y + height
    const rightBarNextPosition = x + width

    Animated.parallel([
      Animated.timing(top.animatedValue.current, {
        toValue: topBarNextPosition,
        ...animationConfig,
      }),
      Animated.timing(bottom.animatedValue.current, {
        toValue: bottomBarNextPosition,
        ...animationConfig,
      }),
      Animated.timing(left.animatedValue.current, {
        toValue: leftBarNextPosition,
        ...animationConfig,
      }),
      Animated.timing(right.animatedValue.current, {
        toValue: rightBarNextPosition,
        ...animationConfig,
      }),
    ]).start(() => {
      top.value.current = topBarNextPosition
      bottom.value.current = bottomBarNextPosition
      left.value.current = leftBarNextPosition
      right.value.current = rightBarNextPosition
    })
  }

  const stopAllAnimations = () => {
    top.animatedValue.current.stopAnimation()
    bottom.animatedValue.current.stopAnimation()
    left.animatedValue.current.stopAnimation()
    right.animatedValue.current.stopAnimation()
  }

  const onDragHandlerStart = () => {
    animateBackdropToTransparent()
    clearCropperAnimationsTimer()
    stopAllAnimations()

    indicatorsRef.current?.showGrid(true)
  }

  const onDragHandlerEnd = () => {
    setActiveHandler(BoxHandlerTypes.None)
    updateImageBounderies(getCurrentBoxBounderies())

    cropperAnimationsTimer(() => {
      updateImageBounderies(getNextBoxBounderies())
      scaleRectangleAndFitIntoPosition()
      animateBackdropToOpaque()

      indicatorsRef.current?.showGrid(false)
    })
  }

  const onDragHandlerCanceled = () => {
    setActiveHandler(BoxHandlerTypes.None)
    animateBackdropToOpaque()

    indicatorsRef.current?.showGrid(false)
  }

  const onDragHandlerFailed = () => {
    setActiveHandler(BoxHandlerTypes.None)
    animateBackdropToOpaque()

    indicatorsRef.current?.showGrid(false)
  }

  /**
   * keep the middle bar between corners, equal distance
   * (d1 + ((d2 - d1) / 2)) - (borderWidth/height / 2)
   */
  const topMiddleBar = Animated.subtract(
    Animated.add(
      left.animatedValue.current,
      Animated.divide(
        Animated.subtract(
          right.animatedValue.current,
          left.animatedValue.current
        ),
        2
      )
    ),
    cornerSize / 2
  )
  const bottomMiddleBar = Animated.subtract(
    Animated.add(
      left.animatedValue.current,
      Animated.divide(
        Animated.subtract(
          right.animatedValue.current,
          left.animatedValue.current
        ),
        2
      )
    ),
    cornerSize / 2
  )

  const leftMiddleBar = Animated.subtract(
    Animated.add(
      bottom.animatedValue.current,
      Animated.divide(
        Animated.subtract(
          top.animatedValue.current,
          bottom.animatedValue.current
        ),
        2
      )
    ),
    cornerSize / 2
  )
  const rightMiddleBar = Animated.subtract(
    Animated.add(
      bottom.animatedValue.current,
      Animated.divide(
        Animated.subtract(
          top.animatedValue.current,
          bottom.animatedValue.current
        ),
        2
      )
    ),
    cornerSize / 2
  )

  const backdropOpacity = opacityAnimation.current.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  })

  const enabled = (handlerType: BoxHandlerTypes) => {
    const allHandlers = [
      BoxHandlerTypes.Bottom,
      BoxHandlerTypes.BottomLeft,
      BoxHandlerTypes.BottomRight,
      BoxHandlerTypes.Left,
      BoxHandlerTypes.Right,
      BoxHandlerTypes.Top,
      BoxHandlerTypes.TopLeft,
      BoxHandlerTypes.TopRight,
    ]

    const index = allHandlers.findIndex((h) => h === handlerType)

    if (index !== -1) {
      allHandlers.splice(index, 1)
    }

    return (
      activeHandler === BoxHandlerTypes.None ||
      !allHandlers.includes(activeHandler)
    )
  }

  // show a loader while the initial sizes are
  if (!initialCropperSize.current.width && !containerLayout.current.width) {
    return (
      <View pointerEvents='none' style={styles.cropboxLoaderContainer}>
        <ActivityIndicator size='small' color='#ffffff' />
      </View>
    )
  }

  const cornerColor = gridColor || '#FCFCFC'

  return (
    <>
      <Indicators
        ref={indicatorsRef}
        top={top}
        bottom={bottom}
        right={right}
        left={left}
        gridColor={gridColor}
        containerWidth={containerLayout.current.width}
        containerHeight={containerLayout.current.height}
      />

      <Overlay
        top={top}
        bottom={bottom}
        right={right}
        left={left}
        rounded={rounded}
        backgroundColor={backgroundColor}
        containerWidth={containerLayout.current.width}
        containerHeight={containerLayout.current.height}
        backdropOpacity={backdropOpacity}
        minCropperBoxSize={minCropperBoxSize.current}
      />

      {/* Render corners */}
      {/** @ts-ignore */}
      <PanGestureHandler
        {...onTopLeftCornerGestureEvent}
        ref={cropBoxRefs[0]}
        enabled={enabled(BoxHandlerTypes.TopLeft)}
        avgTouches
        hitSlop={hitSlop}
        minDist={2}
      >
        <Animated.View
          style={[
            styles.corner,
            styles.topLeftCorner,
            { borderColor: cornerColor },
            {
              transform: [
                {
                  translateX: Animated.subtract(
                    left.animatedValue.current,
                    borderWidth
                  ),
                },
                {
                  translateY: Animated.subtract(
                    top.animatedValue.current,
                    borderWidth
                  ),
                },
              ],
            },
          ]}
        />
      </PanGestureHandler>

      {/** @ts-ignore */}
      <PanGestureHandler
        {...onTopRightCornerGestureEvent}
        ref={cropBoxRefs[1]}
        enabled={enabled(BoxHandlerTypes.TopRight)}
        avgTouches
        hitSlop={hitSlop}
        minDist={2}
      >
        <Animated.View
          style={[
            styles.corner,
            styles.topRightCorner,
            { borderColor: cornerColor },
            {
              transform: [
                {
                  translateX: Animated.subtract(
                    right.animatedValue.current,
                    cornerSize - borderWidth
                  ),
                },
                {
                  translateY: Animated.subtract(
                    top.animatedValue.current,
                    borderWidth
                  ),
                },
              ],
            },
          ]}
        />
      </PanGestureHandler>

      {/** @ts-ignore */}
      <PanGestureHandler
        {...onBottomLeftCornerGestureEvent}
        ref={cropBoxRefs[2]}
        enabled={enabled(BoxHandlerTypes.BottomLeft)}
        avgTouches
        hitSlop={hitSlop}
        minDist={2}
      >
        <Animated.View
          style={[
            styles.corner,
            styles.bottomLeftCorner,
            { borderColor: cornerColor },
            {
              transform: [
                {
                  translateX: Animated.subtract(
                    left.animatedValue.current,
                    borderWidth
                  ),
                },
                {
                  translateY: Animated.subtract(
                    bottom.animatedValue.current,
                    cornerSize - borderWidth
                  ),
                },
              ],
            },
          ]}
        />
      </PanGestureHandler>

      {/** @ts-ignore */}
      <PanGestureHandler
        {...onBottomRightCornerGestureEvent}
        ref={cropBoxRefs[3]}
        enabled={enabled(BoxHandlerTypes.BottomRight)}
        avgTouches
        hitSlop={hitSlop}
        minDist={2}
      >
        <Animated.View
          style={[
            styles.corner,
            styles.bottomRightCorner,
            { borderColor: cornerColor },
            {
              transform: [
                {
                  translateX: Animated.subtract(
                    right.animatedValue.current,
                    cornerSize - borderWidth
                  ),
                },
                {
                  translateY: Animated.subtract(
                    bottom.animatedValue.current,
                    cornerSize - borderWidth
                  ),
                },
              ],
            },
          ]}
        />
      </PanGestureHandler>

      {/* Render middle bars between corners */}

      {!lockedAspectRatio && (
        /** @ts-ignore */
        <PanGestureHandler
          {...onTopBarGestureEvent}
          ref={cropBoxRefs[4]}
          enabled={enabled(BoxHandlerTypes.Top)}
          avgTouches
          hitSlop={hitSlop}
          minDist={2}
        >
          <Animated.View
            style={[
              styles.corner,
              styles.topLine,
              { borderColor: cornerColor },
              {
                transform: [
                  { translateX: topMiddleBar },
                  {
                    translateY: Animated.subtract(
                      top.animatedValue.current,
                      borderWidth
                    ),
                  },
                ],
              },
            ]}
          />
        </PanGestureHandler>
      )}

      {!lockedAspectRatio && (
        /** @ts-ignore */
        <PanGestureHandler
          {...onBottomBarGestureEvent}
          ref={cropBoxRefs[5]}
          enabled={enabled(BoxHandlerTypes.Bottom)}
          avgTouches
          hitSlop={hitSlop}
          minDist={2}
        >
          <Animated.View
            style={[
              styles.corner,
              styles.bottomLine,
              { borderColor: cornerColor },
              {
                transform: [
                  { translateX: bottomMiddleBar },
                  {
                    translateY: Animated.subtract(
                      bottom.animatedValue.current,
                      cornerSize - borderWidth
                    ),
                  },
                ],
              },
            ]}
          />
        </PanGestureHandler>
      )}

      {!lockedAspectRatio && (
        /** @ts-ignore */
        <PanGestureHandler
          {...onLeftBarGestureEvent}
          ref={cropBoxRefs[6]}
          enabled={enabled(BoxHandlerTypes.Left)}
          avgTouches
          hitSlop={hitSlop}
          minDist={2}
        >
          <Animated.View
            style={[
              styles.corner,
              styles.leftLine,
              { borderColor: cornerColor },
              {
                transform: [
                  {
                    translateX: Animated.subtract(
                      left.animatedValue.current,
                      borderWidth
                    ),
                  },
                  { translateY: leftMiddleBar },
                ],
              },
            ]}
          />
        </PanGestureHandler>
      )}

      {!lockedAspectRatio && (
        /** @ts-ignore */
        <PanGestureHandler
          {...onRightBarGestureEvent}
          ref={cropBoxRefs[7]}
          enabled={enabled(BoxHandlerTypes.Right)}
          avgTouches
          hitSlop={hitSlop}
          minDist={2}
        >
          <Animated.View
            style={[
              styles.corner,
              styles.rightLine,
              { borderColor: cornerColor },
              {
                transform: [
                  {
                    translateX: Animated.subtract(
                      right.animatedValue.current,
                      cornerSize - borderWidth
                    ),
                  },
                  { translateY: rightMiddleBar },
                ],
              },
            ]}
          />
        </PanGestureHandler>
      )}
    </>
  )
}

export default forwardRef(CropBox)
