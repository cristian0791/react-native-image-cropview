import { clamp, createAspectRatioRectangle, resize } from '../utils'

describe('Testing all utils functions', () => {
  describe('Testing resize function', () => {
    it('given a 100x100 container and 10x10 child with resize mode cover, returns 100x100 and scale 1', () => {
      const { width, height, scale } = resize({
        containerWidth: 100,
        containerHeight: 100,
        width: 100,
        height: 100,
        resizeMode: 'cover',
      })

      expect(width).toBe(100)
      expect(height).toBe(100)
      expect(scale).toBe(1)
    })

    it('given a 100x100 container and 100x10 child with resize mode cover, returns 100x100 and scale 1', () => {
      const { width, height, scale } = resize({
        containerWidth: 100,
        containerHeight: 100,
        width: 100,
        height: 100,
        resizeMode: 'cover',
      })

      expect(width).toBe(100)
      expect(height).toBe(100)
      expect(scale).toBe(1)
    })

    it('given a 100x100 container and 500x250 child with resize mode contain, returns 100x50 and scale of 0.2', () => {
      const { width, height, scale } = resize({
        containerWidth: 100,
        containerHeight: 100,
        width: 500,
        height: 250,
        resizeMode: 'contain',
      })

      expect(width).toBe(100)
      expect(height).toBe(50)
      expect(scale).toBe(0.2)
    })
  })

  describe('Testing createAspectRatioRectangle function', () => {
    it('given a 100x50 and scale 1, returns 50x50', () => {
      const { width, height } = createAspectRatioRectangle({
        width: 100,
        height: 50,
        aspectRatio: 1,
      })

      expect(width).toBe(50)
      expect(height).toBe(50)
    })
  })

  describe('Testing clamp function', () => {
    it('given a value of 1, min value of 0 max value of 2, return 1', () => {
      const value = clamp({
        value: 1,
        minValue: 0,
        maxValue: 2,
      })

      expect(value).toBe(1)
    })

    it('given a value of 3, min value of 0 max value of 2, return 2', () => {
      const value = clamp({
        value: 3,
        minValue: 0,
        maxValue: 2,
      })

      expect(value).toBe(2)
    })

    it('given a value of -1, min value of 0 max value of 2, return 0', () => {
      const value = clamp({
        value: -1,
        minValue: 0,
        maxValue: 2,
      })

      expect(value).toBe(0)
    })
  })
})
