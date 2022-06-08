import React, {
  createRef,
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { LayoutChangeEvent, LayoutRectangle, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { maximumAvailableScale } from '../config'
import styles from '../styles'
import {
  CropBoxDoneEventProps,
  CropBoxHandler,
  CropperHandler,
  FooterHandler,
  ImageHandler,
  PositionLayout,
  ScaleRange,
} from '../types'
import { createAspectRatioRectangle, measureInWindow, resize } from '../utils'
import Cropbox from './cropbox'
import Footer from './footer'
import Image from './image'

export interface CropperProps {
  /**
   * Show the image specified by the URI param.
   */
  uri: string
  /**
   * A method to provide the original image width and height to the cropper.
   * Feel free to use any method to get the original image width and height;
   * Example: https://www.npmjs.com/package/react-native-image-size
   */
  getImageSize: (uri: string) => Promise<{ width: number; height: number }>
  /**
   * When done button is pressed; Returns x, y, width, height of the crop rectangle
   */
  onDone: (layout: LayoutRectangle) => void
  /**
   * (Optional) on cancel button press
   */
  onCancel?: () => void
  /**
   * (Optional) on reset button press
   */
  onReset?: () => void
  /**
   * (Optional) desired aspect ratio of the crop area;
   * If nothing is provided the crop area is free; If you want to preserve the original
   * aspect ratio only send "original" as aspectRatio prop
   *
   * Example: original(x:x), 4/3, 2/3, 16/9
   */
  aspectRatio?: 'original' | number
  /**
   * (Optional) add round crop indicator and keep aspect ratio to 1
   */
  rounded?: boolean
  /**
   * (Optional) Maximum image scale. Default 10x.
   *
   * Example: scaleMax={3} where scaleMax <= 15 && scaleMax >= 3
   */
  scaleMax?: ScaleRange
  /**
   * (Optional) hide all the bottom actions.
   */
  hideFooter?: boolean
}

const Cropper: ForwardRefRenderFunction<CropperHandler, CropperProps> = (
  {
    uri,
    onCancel,
    onDone,
    onReset,
    aspectRatio,
    rounded,
    scaleMax,
    hideFooter,
    getImageSize,
  },
  ref
) => {
  const containerRef = useRef<View>(null)

  const footerRef = useRef<FooterHandler>(null)
  const cropboxRef = useRef<CropBoxHandler>(null)
  const imageRef = useRef<ImageHandler>(null)
  const originalImageScale = useRef(1)
  const cropBoxRefs = useRef<any>(Array(8).fill(createRef()))

  const initialOnLayoutWasCalled = useRef(false)
  const previousSizes = useRef<{ width: number; height: number }>()

  const [initialMeasures, setInitialMeasures] = useState<LayoutRectangle>()

  useImperativeHandle(ref, () => ({
    done: () => onFooterDone(),
    reset: () => onFooterReset(),
    cancel: () => onFooterCancel(),
  }))

  // Used to initiate the cropper after everything was rendered
  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout

    if (!initialOnLayoutWasCalled.current) {
      initialOnLayoutWasCalled.current = true

      setInitialMeasures(event.nativeEvent.layout)
      initCropper(event.nativeEvent.layout)
    }

    // we have a device rotation
    if (
      width !== previousSizes.current?.width &&
      height !== previousSizes.current?.height
    ) {
      previousSizes.current = {
        width: width,
        height: height,
      }
      cropboxRef.current?.updateCropperToFitInsideContainer(
        event.nativeEvent.layout
      )
    }
  }

  /**
   * 1. Find the cropbox size to fit inside the container, by aspect ratio
   *    or original aspect ratio of the image
   * 2. Resize the image to fit inside the cropper and cover the entire space
   */
  const initCropper = async (measures: LayoutRectangle) => {
    const imageSize = await getImageSize(uri)

    const resizeRatio = imageSize.width / imageSize.height

    const aspectRatioMeasures = createAspectRatioRectangle({
      width: measures.width,
      height: measures.height,
      aspectRatio: getAspectRatio(resizeRatio),
    })

    // resize the aspectRatioMeasures to fit inside the container
    const cropBoxSize = resize({
      containerWidth: measures.width,
      containerHeight: measures.height,
      width: aspectRatioMeasures.width,
      height: aspectRatioMeasures.height,
      resizeMode: 'contain',
    })

    // Get the position of the cropper inside the container.
    // Try to center inside the container
    const cropperX = (measures.width - cropBoxSize.width) / 2
    const cropperY = (measures.height - cropBoxSize.height) / 2

    cropboxRef.current?.resetTo({
      top: cropperY,
      bottom: cropperY + cropBoxSize.height,
      left: cropperX,
      right: cropperX + cropBoxSize.width,
      containerLayout: measures,
    })

    imageRef.current?.setCropboxLayout({
      x: cropperX,
      y: cropperY,
      width: cropBoxSize.width,
      height: cropBoxSize.height,
    })

    // resize the image to fit inside the cropbox
    const resizedImage = resize({
      containerWidth: cropBoxSize.width,
      containerHeight: cropBoxSize.height,
      width: imageSize.width,
      height: imageSize.height,
      resizeMode: 'cover',
    })

    // Save the original image scale to be used on crop done
    originalImageScale.current = resizedImage.scale

    // Get the position of the image inside the container
    const imageX = (measures.width - resizedImage.width) / 2
    const imageY = (measures.height - resizedImage.height) / 2

    cropboxRef.current?.setImageLayout({
      left: imageX,
      top: imageY,
      bottom: imageY + resizedImage.height,
      right: imageX + resizedImage.width,
    })

    imageRef.current?.resetTo({
      x: imageX,
      y: imageY,
      scale: 1,
      width: resizedImage.width,
      height: resizedImage.height,
    })
  }

  // try to sync the values between cropbox and image in realtime
  // and not on event done.
  const updateImageBounderies = (bounderies: LayoutRectangle) => {
    imageRef.current?.setCropboxLayout(bounderies)
  }

  const updateImageZoomAndBounderis = (
    cropBoxLayout: CropBoxDoneEventProps
  ) => {
    imageRef.current?.setCropboxLayout(cropBoxLayout)
    imageRef.current?.pinchToZoom(cropBoxLayout)
    onCropperWasChanged()
  }

  const updateCropboxLayoutBounderies = (imageLayout: PositionLayout) => {
    cropboxRef.current?.setImageLayout(imageLayout)
    onCropperWasChanged()
  }

  const onFooterReset = async () => {
    footerRef.current?.setResetActive(false)
    footerRef.current?.setDoneActive(false)

    const measures = await measureInWindow(containerRef)

    initCropper(measures)

    onReset && onReset()
  }

  const onFooterCancel = () => {
    onCancel && onCancel()
  }

  const onFooterDone = () => {
    if (imageRef.current) {
      const layout = imageRef.current?.getCropArea()

      onDone &&
        onDone({
          x: layout.x / originalImageScale.current,
          y: layout.y / originalImageScale.current,
          width: layout.width / originalImageScale.current,
          height: layout.height / originalImageScale.current,
        })
    }
  }

  const onCropperWasChanged = () => {
    footerRef.current?.setDoneActive(true)
    footerRef.current?.setResetActive(true)
  }

  const lockedAspectRatio = () => {
    return !!aspectRatio || !!rounded
  }

  const getAspectRatio = (ratio: number) => {
    let expectedRatio: number = ratio

    if (aspectRatio && aspectRatio !== 'original') {
      expectedRatio = aspectRatio
    }
    if (rounded) {
      expectedRatio = 1
    }
    return expectedRatio
  }

  const getscaleMax = () => {
    if (scaleMax && scaleMax <= maximumAvailableScale && scaleMax >= 3) {
      return scaleMax
    }
    return 10
  }

  return (
    <GestureHandlerRootView style={styles.rootView}>
      <View
        onLayout={onContainerLayout}
        ref={containerRef}
        style={[styles.cropperContainer]}
      >
        {initialMeasures && (
          <>
            <Cropbox
              ref={cropboxRef}
              cropBoxRefs={cropBoxRefs.current}
              onCropBoxDone={updateImageZoomAndBounderis}
              updateImageBounderies={updateImageBounderies}
              lockedAspectRatio={lockedAspectRatio()}
              rounded={rounded}
            />

            <Image
              ref={imageRef}
              cropBoxRefs={cropBoxRefs.current}
              uri={uri}
              onImageDone={updateCropboxLayoutBounderies}
              onImageMove={() => cropboxRef.current?.holdAnimations()}
              maxScale={getscaleMax()}
            />
          </>
        )}
      </View>

      {!hideFooter && (
        <Footer
          ref={footerRef}
          onDone={onFooterDone}
          onCancel={onFooterCancel}
          onReset={onFooterReset}
        />
      )}
    </GestureHandlerRootView>
  )
}

export default forwardRef(Cropper)
