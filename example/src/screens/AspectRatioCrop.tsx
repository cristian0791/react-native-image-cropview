import React, { useState } from 'react';
import { Button, Image, LayoutRectangle, Text, View } from 'react-native';

import Cropper from 'react-native-image-cropview';
import ImageEditor from "@react-native-community/image-editor";

import { launchImageLibrary } from 'react-native-image-picker';
import { getImageSize } from '../utils';

const AspectRatioCrop = () => {
  const [pickedImage, setPickedImage] = useState<any>();
  const [croppedImage, setCroppedImage] = useState<any>();

  const showImagePicker = async () => {
    try {
      const { assets } = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1
      });

      if(assets && assets?.length > 0) {
        setPickedImage(assets[0]);
      }
    } catch (error) {
      console.log(error);
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
    setCroppedImage(null);
  }

  return (
    <View style={{ flex: 1 }}>
      {
        !pickedImage && !croppedImage && (
          <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <Button
              title="Pick an image"
              onPress={showImagePicker}
            />
          </View>
        )
      }

      {
        !croppedImage && !!pickedImage && (
          <Cropper
            uri={pickedImage.uri}
            onDone={onCropDone}
            onCancel={onCropCancel}
            scaleMax={5}
            getImageSize={getImageSize}
            aspectRatio="original"
          />
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
 
export default AspectRatioCrop;