import {
  Dimensions,
  LayoutRectangle,
  Platform,
  ScaledSize,
  StatusBar,
} from 'react-native'

export const measureInWindow = async (ref: any): Promise<LayoutRectangle> => {
  return new Promise((resolve) => {
    ref.current?.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        resolve({ x, y, width, height })
      }
    )
  })
}

export const resize = ({
  resizeMode = 'contain',
  containerWidth,
  containerHeight,
  width,
  height,
}: {
  resizeMode?: 'contain' | 'cover'
  containerWidth: number
  containerHeight: number
  width: number
  height: number
}) => {
  const newBoxWidth1 = containerWidth
  const newBoxHeight1 = (containerWidth * height) / width

  const newBoxWidth2 = (containerHeight * width) / height
  const newBoxHeight2 = containerHeight

  var scale = 1
  var newBoxWidth = 0
  var newBoxHeight = 0

  const isSize =
    (resizeMode === 'contain' && newBoxHeight1 <= containerHeight) ||
    (resizeMode === 'cover' && newBoxHeight1 >= containerHeight)

  if (isSize) {
    newBoxWidth = newBoxWidth1
    newBoxHeight = newBoxHeight1
    scale = newBoxHeight1 / height
  } else {
    newBoxWidth = newBoxWidth2
    newBoxHeight = newBoxHeight2
    scale = newBoxWidth2 / width
  }

  return {
    width: newBoxWidth,
    height: newBoxHeight,
    scale,
  }
}

export const createAspectRatioRectangle = ({
  width,
  height,
  aspectRatio,
}: {
  width: number
  height: number
  aspectRatio: number
}) => {
  if (width > height) {
    return {
      width: height,
      height: height / aspectRatio,
    }
  }
  return {
    width: width,
    height: width / aspectRatio,
  }
}

export const clamp = ({
  value,
  minValue,
  maxValue,
}: {
  value: number
  minValue: number
  maxValue: number
}) => {
  return Math.min(Math.max(value, minValue), maxValue)
}

// Also detects if is iphone 12
export function isIphoneX() {
  const dimen = Dimensions.get('window')
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (dimen.height === 780 ||
      dimen.width === 780 ||
      dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 844 ||
      dimen.width === 844 ||
      dimen.height === 896 ||
      dimen.width === 896 ||
      dimen.height === 926 ||
      dimen.width === 926)
  )
}

export function getStatusBarHeight(skipAndroid?: boolean) {
  return Platform.select({
    ios: isIphoneX() ? 44 : 20,
    android: skipAndroid ? 0 : StatusBar.currentHeight,
    default: 0,
  })
}

export const getMinCropperSize = ({
  width,
  height,
  ratio,
}: ScaledSize & { ratio: number }) => {
  // find minimum size starting from this
  let size = 100
  // if the device is rotated
  if (width > height) {
    size = (size * width) / (height + getStatusBarHeight())
  }

  const resized = createAspectRatioRectangle({
    width: size,
    height: size,
    aspectRatio: ratio,
  })

  return {
    width: resized.width,
    height: resized.height,
  }
}
