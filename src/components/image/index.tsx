import React, {
  createRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Animated, LayoutRectangle } from 'react-native'
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler'

import { animationConfig, maximumAvailableScale } from '../../config'
import {
  useGestureEvent,
  usePanTranslationFrame,
  useScaleFrame,
} from '../../hooks'
import styles from '../../styles'
import {
  CropBoxDoneEventProps,
  ImageHandler,
  PositionLayout,
  ValueXY,
} from '../../types'
import { resize } from '../../utils'

interface ImageProps {
  uri: string
  onImageDone: (layout: PositionLayout) => void
  onImageMove: () => void
  cropBoxRefs: Array<React.Ref<any>>
  maxScale?: number
}

const Image: ForwardRefRenderFunction<ImageHandler, ImageProps> = (
  {
    uri,
    onImageDone,
    onImageMove,
    cropBoxRefs,
    maxScale = maximumAvailableScale,
  },
  ref
) => {
  // sizes needs to be keeped in state to rerender the image component
  // everytime when the sizes changes
  const [imageSizes, setImageSizes] = useState({ width: 0, height: 0 })

  const imageLayout = useRef<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const cropBoxLayout = useRef<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  const pinchRef = createRef()
  const panRef = createRef()

  const displayScale = useRef(new Animated.Value(1))
  const displayScaleTrack = useRef(1)

  const [panTranslationFrame, resetPanTranslationFrame] =
    usePanTranslationFrame()
  const [updateScaleFrame, resetScaleFrame] = useScaleFrame()

  const displayTranslation = useRef(
    new Animated.ValueXY({ x: imageLayout.current.x, y: imageLayout.current.y })
  )
  const displayTranslationTrack = useRef({
    x: imageLayout.current.x,
    y: imageLayout.current.y,
  })

  // track decay animatations values
  const decayValues = useRef<{
    x: number
    y: number
    stateX: State
    stateY: State
  }>({ x: 0, y: 0, stateX: State.END, stateY: State.END })
  displayTranslation.current.addListener((value) => trackDecayAnimations(value))

  useImperativeHandle(ref, () => ({
    setCropboxLayout: (layout: LayoutRectangle) => {
      cropBoxLayout.current = layout
    },
    pinchToZoom: ({
      focalX,
      focalY,
      scale,
      translateX,
      translateY,
    }: CropBoxDoneEventProps) => {
      const newScale = Math.min(maxScale, displayScaleTrack.current * scale)

      const { x, y } = getCenterImage()

      const dX = (x - focalX + displayTranslationTrack.current.x) * (scale - 1)
      const dY = (y - focalY + displayTranslationTrack.current.y) * (scale - 1)

      const recenteredX = displayTranslationTrack.current.x + dX + translateX
      const recenteredY = displayTranslationTrack.current.y + dY + translateY

      Animated.parallel([
        Animated.timing(displayScale.current, {
          toValue: newScale,
          ...animationConfig,
        }),
        Animated.timing(displayTranslation.current.x, {
          toValue: recenteredX,
          ...animationConfig,
        }),
        Animated.timing(displayTranslation.current.y, {
          toValue: recenteredY,
          ...animationConfig,
        }),
      ]).start(() => {
        displayScaleTrack.current = newScale

        displayTranslationTrack.current = {
          x: recenteredX,
          y: recenteredY,
        }

        recenterImage({ x: true, y: true })
      })
    },
    resetTo: ({ scale, x, y, width, height }) => {
      displayTranslation.current.setValue({ x, y })
      displayTranslationTrack.current = { x, y }

      displayScale.current.setValue(scale)
      displayScaleTrack.current = scale

      imageLayout.current = { x, y, width, height }
      setImageSizes({ width, height })
    },
    getCropArea: () => {
      const { apparentTop } = getApparentY(displayTranslationTrack.current.y)
      const { apparentLeft } = getApparentX(displayTranslationTrack.current.x)

      const y =
        (cropBoxLayout.current.y - apparentTop) / displayScaleTrack.current
      const x =
        (cropBoxLayout.current.x - apparentLeft) / displayScaleTrack.current

      return {
        x,
        y,
        width: cropBoxLayout.current.width / displayScaleTrack.current,
        height: cropBoxLayout.current.height / displayScaleTrack.current,
      }
    },
  }))

  const panGestureEvent = useGestureEvent((event) => {
    const { state, translationX, translationY, velocityX, velocityY } =
      event.nativeEvent

    if (state === State.BEGAN) {
      stopAllAnimations()
    } else if (state === State.ACTIVE) {
      const { framesX, framesY } = panTranslationFrame({
        translationX,
        translationY,
      })

      // set track animated values
      displayTranslationTrack.current = {
        x: displayTranslationTrack.current.x + framesX,
        y: displayTranslationTrack.current.y + framesY,
      }

      // set the animated values
      displayTranslation.current.setValue(displayTranslationTrack.current)
      onImageMove()
    } else if (state === State.END) {
      resetPanTranslationFrame()
      decayImage({ velocityX, velocityY })
    }
  })

  const pinchGestureEvent = useGestureEvent((event) => {
    const { state, scale, focalX, focalY } = event.nativeEvent

    if (state === State.BEGAN) {
      stopAllAnimations()
    } else if (state === State.ACTIVE) {
      // Find the minimum scale that fits into container(cropbox)
      const { scale: minScale } = resize({
        containerWidth: cropBoxLayout.current.width,
        containerHeight: cropBoxLayout.current.height,
        width: imageLayout.current.width,
        height: imageLayout.current.height,
        resizeMode: 'cover',
      })

      const { scaleFrame } = updateScaleFrame(scale)

      const { x, y } = getCenterImage()

      const deltaPinchX =
        (1 - scaleFrame) * (focalX - displayTranslationTrack.current.x - x)
      const deltaPinchY =
        (1 - scaleFrame) * (focalY - displayTranslationTrack.current.y - y)

      // set track animated values
      const nextScale = Math.max(
        displayScaleTrack.current * scaleFrame,
        minScale - 0.2
      )
      displayScaleTrack.current = Math.min(nextScale, maxScale)

      if (displayScaleTrack.current < maxScale) {
        displayTranslationTrack.current = {
          x: displayTranslationTrack.current.x + deltaPinchX,
          y: displayTranslationTrack.current.y + deltaPinchY,
        }

        // set the animated values
        displayScale.current.setValue(displayScaleTrack.current)
        displayTranslation.current.setValue(displayTranslationTrack.current)

        onImageMove()
      }
    } else if (state === State.END) {
      resetScaleFrame()
      recenterImage({ x: true, y: true })
    }
  })

  const getCenterImage = (): ValueXY => {
    return {
      x: imageLayout.current.width / 2,
      y: imageLayout.current.height / 2,
    }
  }

  const stopAllAnimations = () => {
    displayTranslation.current.stopAnimation()
    displayScale.current.stopAnimation()
  }

  const getRecenteredImagePositionValues = () => {
    // Find the minimum scale that fits into container(cropbox)
    const { scale: minScale } = resize({
      containerWidth: cropBoxLayout.current.width,
      containerHeight: cropBoxLayout.current.height,
      width: imageLayout.current.width,
      height: imageLayout.current.height,
      resizeMode: 'cover',
    })

    const clampedScale = Math.min(
      maxScale,
      Math.max(displayScaleTrack.current, minScale)
    )

    const apparentHeight = imageLayout.current.height * clampedScale
    const apparentWidth = imageLayout.current.width * clampedScale

    const heightDiff = (apparentHeight - imageLayout.current.height) / 2
    const widthDiff = (apparentWidth - imageLayout.current.width) / 2

    const top = displayTranslationTrack.current.y - heightDiff
    const bottom = top + apparentHeight
    const left = displayTranslationTrack.current.x - widthDiff
    const right = left + apparentWidth

    let recenteredX = displayTranslationTrack.current.x
    let recenteredY = displayTranslationTrack.current.y

    if (top > cropBoxLayout.current.y) {
      recenteredY = cropBoxLayout.current.y + heightDiff
    } else if (
      bottom <
      cropBoxLayout.current.y + cropBoxLayout.current.height
    ) {
      recenteredY =
        cropBoxLayout.current.y +
        heightDiff -
        apparentHeight +
        cropBoxLayout.current.height
    }

    if (left > cropBoxLayout.current.x) {
      recenteredX = cropBoxLayout.current.x + widthDiff
    } else if (right < cropBoxLayout.current.x + cropBoxLayout.current.width) {
      recenteredX =
        cropBoxLayout.current.x +
        widthDiff -
        apparentWidth +
        cropBoxLayout.current.width
    }

    return {
      scale: clampedScale,
      x: recenteredX,
      y: recenteredY,
      apparentLeft: recenteredX - widthDiff,
      apparentTop: recenteredY - heightDiff,
      apparentRight:
        recenteredX - widthDiff + imageLayout.current.width * clampedScale,
      apparentBottom:
        recenteredY - heightDiff + imageLayout.current.height * clampedScale,
    }
  }

  const getApparentY = (currentY: number) => {
    const apparentHeight =
      imageLayout.current.height * displayScaleTrack.current
    const heightDiff = (apparentHeight - imageLayout.current.height) / 2

    const apparentTop = currentY - heightDiff
    const apparentBottom =
      currentY -
      heightDiff +
      imageLayout.current.height * displayScaleTrack.current

    return { apparentTop, apparentBottom }
  }

  const getApparentX = (currentX: number) => {
    const apparentWidth = imageLayout.current.width * displayScaleTrack.current
    const widthDiff = (apparentWidth - imageLayout.current.width) / 2

    const apparentLeft = currentX - widthDiff
    const apparentRight =
      currentX -
      widthDiff +
      imageLayout.current.width * displayScaleTrack.current

    return { apparentLeft, apparentRight }
  }

  const trackDecayAnimations = (value: ValueXY) => {
    decayValues.current = { ...decayValues.current, ...value }

    if (decayValues.current.stateY === State.ACTIVE) {
      const { apparentTop, apparentBottom } = getApparentY(value.y)

      if (
        apparentTop >= cropBoxLayout.current.y ||
        apparentBottom <= cropBoxLayout.current.y + cropBoxLayout.current.height
      ) {
        displayTranslation.current.y.stopAnimation()
        displayTranslationTrack.current.y = value.y
      }
    }

    if (decayValues.current.stateX === State.ACTIVE) {
      const { apparentLeft, apparentRight } = getApparentX(value.x)

      if (
        apparentLeft >= cropBoxLayout.current.x ||
        apparentRight <= cropBoxLayout.current.x + cropBoxLayout.current.width
      ) {
        displayTranslation.current.x.stopAnimation()
        displayTranslationTrack.current.x = value.x
      }
    }
  }

  const decayImage = ({
    velocityX,
    velocityY,
  }: {
    velocityX: number
    velocityY: number
  }) => {
    const vx = velocityX / 2000
    const vy = velocityY / 2000
    const deceleration = 0.994

    decayValues.current = {
      ...decayValues.current,
      stateX: State.ACTIVE,
      stateY: State.ACTIVE,
    }

    Animated.decay(displayTranslation.current.x, {
      velocity: vx,
      deceleration,
      useNativeDriver: true,
    }).start(() => {
      decayValues.current = { ...decayValues.current, stateX: State.END }
      displayTranslationTrack.current.x = decayValues.current.x

      recenterImage({
        x: true,
      })
    })

    Animated.decay(displayTranslation.current.y, {
      velocity: vy,
      deceleration,
      useNativeDriver: true,
    }).start(() => {
      decayValues.current = { ...decayValues.current, stateY: State.END }
      displayTranslationTrack.current.y = decayValues.current.y

      recenterImage({
        y: true,
      })
    })
  }

  const recenterImage = (axis: Partial<{ x: boolean; y: boolean }>) => {
    const {
      scale,
      x,
      y,
      apparentLeft,
      apparentRight,
      apparentBottom,
      apparentTop,
    } = getRecenteredImagePositionValues()

    const animations = [
      Animated.timing(displayScale.current, {
        toValue: scale,
        ...animationConfig,
      }),
    ]

    if (axis.x) {
      animations.push(
        Animated.timing(displayTranslation.current.x, {
          toValue: x,
          ...animationConfig,
        })
      )
    }

    if (axis.y) {
      animations.push(
        Animated.timing(displayTranslation.current.y, {
          toValue: y,
          ...animationConfig,
        })
      )
    }

    Animated.parallel(animations).start(() => {
      if (axis.x) {
        displayTranslationTrack.current.x = x
      }

      if (axis.y) {
        displayTranslationTrack.current.y = y
      }

      displayScaleTrack.current = scale
    })

    onImageDone &&
      onImageDone({
        left: apparentLeft,
        top: apparentTop,
        bottom: apparentBottom,
        right: apparentRight,
      })
  }

  return (
    <Animated.View style={styles.imageContainer}>
      {/** @ts-ignore */}
      <PinchGestureHandler
        {...pinchGestureEvent}
        ref={pinchRef}
        simultaneousHandlers={[panRef]}
      >
        <Animated.View style={styles.imageContainer}>
          {/** @ts-ignore */}
          <PanGestureHandler
            {...panGestureEvent}
            avgTouches
            ref={panRef}
            simultaneousHandlers={pinchRef}
            maxPointers={2}
            shouldCancelWhenOutside={false}
            minDist={6}
            waitFor={cropBoxRefs}
          >
            <Animated.Image
              source={{ uri }}
              style={{
                width: imageSizes.width,
                height: imageSizes.height,
                transform: [
                  { translateX: displayTranslation.current.x },
                  { translateY: displayTranslation.current.y },
                  { scale: displayScale.current },
                ],
              }}
              resizeMode='contain'
            />
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </Animated.View>
  )
}

export default React.forwardRef(Image)
