import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

import {
  FramesXY,
  NativeEvent,
  ScaleFrame,
  SharedValue,
  TranslationXY,
} from './types'

export const useScaleFrame = (): [
  (scale: number) => ScaleFrame,
  () => void
] => {
  const diffThisFrame = useRef(1)
  const prevValue = useRef(1)

  const reset = () => {
    prevValue.current = 1
  }

  const update = (scale: number) => {
    diffThisFrame.current = scale / prevValue.current
    prevValue.current = scale

    return {
      scaleFrame: diffThisFrame.current,
    }
  }

  return [update, reset]
}

export const usePanTranslationFrame = (
  initial?: Partial<{ x: number; y: number }>
): [
  (t: TranslationXY) => FramesXY,
  (values?: Partial<{ x: number; y: number }>) => void
] => {
  const diffThisFrame = useRef<FramesXY>({ framesX: 0, framesY: 0 })

  const prevValue = useRef({
    x: initial?.x || 0,
    y: initial?.y || 0,
  })

  const reset = (values?: Partial<{ x: number; y: number }>) => {
    prevValue.current = {
      x: values?.x || 0,
      y: values?.y || 0,
    }
  }

  const update = ({ translationX, translationY }: TranslationXY): FramesXY => {
    diffThisFrame.current = {
      framesX: translationX - prevValue.current.x,
      framesY: translationY - prevValue.current.y,
    }

    prevValue.current = {
      x: translationX,
      y: translationY,
    }

    return diffThisFrame.current
  }

  return [update, reset]
}

export const useGestureEvent = (func: (event: NativeEvent) => void) => {
  const gestureEvent = (event: NativeEvent) => {
    func && func(event)
  }

  return {
    onHandlerStateChange: gestureEvent,
    onGestureEvent: gestureEvent,
  }
}

export const useSharedValue = (i: number): [SharedValue] => {
  const sharedValue = useRef(i)
  const animatedValue = useRef(new Animated.Value(i))

  const setAnimatedValue = (n: number) => {
    animatedValue.current.setValue(n)
  }

  const setValue = (n: number) => {
    sharedValue.current = n
  }

  return [
    {
      value: sharedValue,
      animatedValue: animatedValue,
      setAnimatedValue,
      setValue,
    },
  ]
}

export const useTimeout = (
  delay: number
): [(fn: () => void) => void, () => void, () => void] => {
  // eslint-disable-next-line no-undef
  const timerId = useRef<NodeJS.Timeout>()
  const func = useRef<() => void>()

  const startTimer = (fn: () => void) => {
    func.current = fn
    timerId.current = setTimeout(func.current, delay)
  }

  const resetTimer = () => {
    clearTimer()
    !!func.current && startTimer(func.current)
  }

  const clearTimer = () => {
    if (timerId.current) {
      clearTimeout(timerId.current)
    }
  }

  useEffect(() => {
    ;() => clearTimer()
  }, [])

  return [startTimer, clearTimer, resetTimer]
}
