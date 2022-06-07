import React from 'react'
import { Animated, Dimensions, Platform } from 'react-native'

import { SharedValue } from '../../types'

interface OverlayProps {
  top: SharedValue
  bottom: SharedValue
  right: SharedValue
  left: SharedValue
  rounded?: boolean
  containerWidth: number
  containerHeight: number
  backdropOpacity: Animated.AnimatedInterpolation
  minCropperBoxSize: { width: number; height: number }
}

const Overlay: React.FC<OverlayProps> = ({
  top,
  bottom,
  right,
  left,
  rounded,
  containerWidth,
  containerHeight,
  backdropOpacity,
  minCropperBoxSize,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen')

  const currentHeight = Animated.subtract(
    containerHeight,
    Animated.add(
      top.animatedValue.current,
      Animated.subtract(containerHeight, bottom.animatedValue.current)
    )
  )

  const currentWidth = Animated.subtract(
    containerWidth,
    Animated.add(
      left.animatedValue.current,
      Animated.subtract(containerWidth, right.animatedValue.current)
    )
  )

  // get the bigest dimnesion and use it as default;
  // Find the minimum scale of the cropper to resize the overlay view
  // We need to resize all the calculations to the scale value,
  // because ios support maximum border of 2700

  const deviceSize = Math.max(screenWidth, screenHeight)
  const minCropSize = Math.min(
    minCropperBoxSize.width,
    minCropperBoxSize.height
  )
  const scale = deviceSize / minCropSize
  const apparentSize = deviceSize * scale * 2

  const horizontalBorderSize = (apparentSize - containerHeight) / 2
  const verticalBorderSize = (apparentSize - containerWidth) / 2

  const positionTop = (containerHeight - apparentSize / scale) / 2
  const positionLeft = (containerWidth - apparentSize / scale) / 2

  const scaleY = Animated.divide(currentHeight, containerHeight)
  const scaleX = Animated.divide(currentWidth, containerWidth)

  const translateTop = top.animatedValue.current.interpolate({
    inputRange: [0, containerHeight],
    outputRange: [0, containerHeight / 2],
  })

  const translateBottom = bottom.animatedValue.current.interpolate({
    inputRange: [0, containerHeight],
    outputRange: [containerHeight / -2, 0],
  })

  const translateLeft = left.animatedValue.current.interpolate({
    inputRange: [0, containerWidth],
    outputRange: [0, containerWidth / 2],
  })

  const translateRight = right.animatedValue.current.interpolate({
    inputRange: [0, containerWidth],
    outputRange: [containerWidth / -2, 0],
  })

  const translateX = Animated.add(translateLeft, translateRight)
  const translateY = Animated.add(translateTop, translateBottom)

  return (
    <>
      <Animated.View
        pointerEvents='box-none'
        style={[
          // eslint-disable-next-line react-native/no-inline-styles
          {
            position: 'absolute',
            opacity: backdropOpacity,
            zIndex: 10,
            width: apparentSize / scale,
            height: apparentSize / scale,
            top: positionTop,
            left: positionLeft,
            borderRadius: rounded ? apparentSize / 2 / scale : 0,
            borderTopColor: 'rgba(0,0,0,0.85)',
            borderBottomColor: 'rgba(0,0,0,0.85)',
            borderLeftColor: 'rgba(0,0,0,0.85)',
            borderRightColor: Platform.select({
              ios: 'rgba(0,0,0,0.85)',
              android: 'rgba(0,0,0,0.849)',
            }),
            transform: [
              { translateX },
              { translateY },
              { scaleX },
              { scaleY },
              { scale },
            ],
            borderTopWidth: horizontalBorderSize / scale,
            borderBottomWidth: horizontalBorderSize / scale,
            borderLeftWidth: verticalBorderSize / scale,
            borderRightWidth: verticalBorderSize / scale,
          },
        ]}
      />
    </>
  )
}

export default Overlay
