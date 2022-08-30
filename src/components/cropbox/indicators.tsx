import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'
import { Animated } from 'react-native'

import { borderWidth } from '../../config'
import styles from '../../styles'
import { IndicatorHandler, SharedValue } from '../../types'

interface IndicatorsProps {
  top: SharedValue
  bottom: SharedValue
  right: SharedValue
  left: SharedValue
  containerWidth: number
  containerHeight: number
  gridColor: string
}

const Indicators: ForwardRefRenderFunction<
  IndicatorHandler,
  IndicatorsProps
> = (
  { top, bottom, right, left, containerWidth, containerHeight, gridColor },
  ref
) => {
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

  const [showGrid, setShowGrid] = useState(false)

  useImperativeHandle(ref, () => ({
    showGrid: (s: boolean) => setShowGrid(s),
  }))

  const marginBarSize = 1
  const centerBarSize = 0.5
  const lineColor = gridColor || '#FFFFFF'

  const verticalBarsSpaceBetween = Animated.divide(
    Animated.subtract(
      Animated.subtract(
        right.animatedValue.current,
        left.animatedValue.current
      ),
      borderWidth
    ),
    3
  )

  const horizontalBarsSpaceBetween = Animated.divide(
    Animated.subtract(
      Animated.subtract(
        bottom.animatedValue.current,
        top.animatedValue.current
      ),
      borderWidth
    ),
    3
  )

  return (
    <>
      {/** Verticals bars */}
      <Animated.View
        style={[
          styles.marginIndicator,
          {
            width: marginBarSize,
            height: containerHeight,
            backgroundColor: lineColor,
          },
          {
            transform: [
              { translateY: translateY },
              {
                translateX: Animated.subtract(
                  left.animatedValue.current,
                  marginBarSize
                ),
              },
              { scaleY },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.marginIndicator,
          {
            width: marginBarSize,
            height: containerHeight,
            backgroundColor: lineColor,
          },
          {
            transform: [
              { translateY: translateY },
              { translateX: right.animatedValue.current },
              { scaleY },
            ],
          },
        ]}
      />

      {/** Center vertical bars */}
      {showGrid && (
        <>
          <Animated.View
            style={[
              styles.centerIndicators,
              {
                width: centerBarSize,
                height: containerHeight,
                backgroundColor: lineColor,
              },
              {
                transform: [
                  { translateY: translateY },
                  {
                    translateX: Animated.add(
                      left.animatedValue.current,
                      verticalBarsSpaceBetween
                    ),
                  },
                  { scaleY },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.centerIndicators,
              {
                width: centerBarSize,
                height: containerHeight,
                backgroundColor: lineColor,
              },
              {
                transform: [
                  { translateY: translateY },
                  {
                    translateX: Animated.add(
                      left.animatedValue.current,
                      Animated.multiply(verticalBarsSpaceBetween, 2)
                    ),
                  },
                  { scaleY },
                ],
              },
            ]}
          />
        </>
      )}

      {/** Horizontals bars */}
      <Animated.View
        style={[
          styles.marginIndicator,
          {
            height: marginBarSize,
            width: containerWidth,
            backgroundColor: lineColor,
          },
          {
            transform: [
              {
                translateY: Animated.subtract(
                  top.animatedValue.current,
                  marginBarSize
                ),
              },
              { translateX: translateX },
              { scaleX },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.marginIndicator,
          {
            height: marginBarSize,
            width: containerWidth,
            backgroundColor: lineColor,
          },
          {
            transform: [
              { translateY: bottom.animatedValue.current },
              { translateX: translateX },
              { scaleX },
            ],
          },
        ]}
      />

      {/** Center horizzntal bars */}
      {showGrid && (
        <>
          <Animated.View
            style={[
              styles.centerIndicators,
              {
                height: centerBarSize,
                width: containerWidth,
                backgroundColor: lineColor,
              },
              {
                transform: [
                  {
                    translateY: Animated.add(
                      top.animatedValue.current,
                      horizontalBarsSpaceBetween
                    ),
                  },
                  { translateX: translateX },
                  { scaleX },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.centerIndicators,
              {
                height: centerBarSize,
                width: containerWidth,
                backgroundColor: lineColor,
              },
              {
                transform: [
                  {
                    translateY: Animated.add(
                      top.animatedValue.current,
                      Animated.multiply(horizontalBarsSpaceBetween, 2)
                    ),
                  },
                  { translateX: translateX },
                  { scaleX },
                ],
              },
            ]}
          />
        </>
      )}
    </>
  )
}

export default forwardRef(Indicators)
