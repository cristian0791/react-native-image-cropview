import { renderHook } from '@testing-library/react-hooks'
import { act } from 'react-test-renderer'

import {
  useGestureEvent,
  usePanTranslationFrame,
  useScaleFrame,
  useSharedValue,
} from '../hooks'

describe('Testing hooks', () => {
  describe('Testing useScaleFrame function', () => {
    it('Should update the scale frame', () => {
      const { result } = renderHook(useScaleFrame)
      const [update, reset] = result.current

      const update1 = update(1)
      expect(update1.scaleFrame).toEqual(1)

      const update2 = update(2)
      expect(update2.scaleFrame).toEqual(2)

      const update3 = update(4)
      expect(update3.scaleFrame).toEqual(2)

      act(() => {
        reset()
      })

      const update4 = update(1)
      expect(update4.scaleFrame).toEqual(1)
    })

    it('Should update the translation frame', () => {
      const { result } = renderHook(() =>
        usePanTranslationFrame({ x: 0, y: 0 })
      )
      const [update, reset] = result.current

      const update1 = update({ translationX: 1, translationY: 1 })
      expect(update1.framesX).toEqual(1)
      expect(update1.framesY).toEqual(1)

      const update2 = update({ translationX: 2, translationY: 2 })
      expect(update2.framesX).toEqual(1)
      expect(update2.framesY).toEqual(1)

      const update3 = update({ translationX: 3, translationY: 3 })
      expect(update3.framesX).toEqual(1)
      expect(update3.framesY).toEqual(1)

      act(() => {
        reset({ x: 0, y: 0 })
      })

      const update4 = update({ translationX: 1, translationY: 1 })
      expect(update4.framesX).toEqual(1)
      expect(update4.framesY).toEqual(1)
    })

    it('Should return correct values', () => {
      const { result } = renderHook(() => useSharedValue(0))
      const [sharedValue] = result.current

      expect(sharedValue.value.current).toEqual(0)
      //@ts-ignore
      expect(sharedValue.animatedValue.current._value).toEqual(0)

      act(() => {
        sharedValue.setValue(1)
        sharedValue.setAnimatedValue(1)
      })

      expect(sharedValue.value.current).toEqual(1)
      //@ts-ignore
      expect(sharedValue.animatedValue.current._value).toEqual(1)
    })

    it('Should return the same function back', () => {
      const testFunction = () => 1

      const { result } = renderHook(() => useGestureEvent(testFunction))
      const { onGestureEvent, onHandlerStateChange } = result.current

      const event: any = () => {}
      expect(onGestureEvent(event)).toEqual(onHandlerStateChange(event))
    })
  })
})
