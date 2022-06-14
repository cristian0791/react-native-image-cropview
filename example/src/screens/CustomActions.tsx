import React, { useRef, useState, createRef } from 'react';
import { Button, Image, LayoutRectangle, Text, View } from 'react-native';

import Cropper from 'react-native-image-cropview';
import ImageEditor from "@react-native-community/image-editor";

import { launchImageLibrary } from 'react-native-image-picker';
import { CropperHandler } from '../../../src/types';
import { getImageSize } from '../utils';

const CustomActions = () => {
  const [pickedImage, setPickedImage] = useState<any>();
  const [croppedImage, setCroppedImage] = useState<any>();
  const [showCropper, setShowCropper] = useState<boolean>(false);

  const cropperRef = useRef<CropperHandler>(null);

  const showImagePicker = async () => {
    try {
      const { assets } = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1
      });

      if(assets && assets?.length > 0) {
        setPickedImage(assets[0]);
        setShowCropper(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const onCropDone = (layout: LayoutRectangle) => {
    const cropData = {
      offset: {x: layout.x, y: layout.y},
      size: {width: layout.width, height: layout.height},
    };
      
    ImageEditor.cropImage(pickedImage.uri, cropData).then(url => {
      setCroppedImage(url);
    });
  }

  const onCropCancel = () => {
    setPickedImage(null);
    setShowCropper(false);
    setCroppedImage(null);
  }

  return (
    <View style={{ flex: 1 }}>
      {
        !pickedImage && !showCropper && !croppedImage && (
          <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <Button
              title="Pick an image"
              onPress={showImagePicker}
            />
          </View>
        )
      }

      {
        !croppedImage && showCropper && (
          <View style={{flex: 1}}>
            <Cropper
              ref={cropperRef}
              uri={pickedImage.uri}
              onDone={onCropDone}
              onCancel={onCropCancel}
              scaleMax={5}
              hideFooter={true}
              getImageSize={getImageSize}
            />

            <View style={{width: "100%", flexDirection: "row", paddingHorizontal: 30, justifyContent: "space-between", marginBottom: 50}}>
              <Button
                title="Cancel"
                onPress={() => cropperRef.current?.cancel()}
              />

              <Button
                title="Reset"
                onPress={() => cropperRef.current?.reset()}
              />
              
              <Button
                title="Done"
                onPress={() => cropperRef.current?.done()}
              />
            </View>
          </View>
        )
      }

      {
        croppedImage && (
          <View style={{flex: 1,  alignItems: "center", padding: 10}}>
            <Image
              source={{uri: croppedImage}}
              style={{ width: "100%", height: "50%", resizeMode:"contain"}}
            />

            <Button
              title="Crop Again"
              onPress={onCropCancel}
            />
          </View>
        )
      }
    </View>
  )
}
 
export default CustomActions;