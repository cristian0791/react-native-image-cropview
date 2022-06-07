#  `@react-native-image-cropview`

A React Native module that allows you to crop photos, built with react native Animated api and react-native-gesture-handler.

<p align="center">
  <img src="https://img.shields.io/npm/dw/react-native-image-cropview" />
  <img src="https://img.shields.io/npm/v/react-native-image-cropview" />
  <img src="https://img.shields.io/badge/platforms-android%20|%20ios-lightgrey.svg" />
  <img src="https://img.shields.io/npm/l/react-native-image-cropview" />
</p>

| Android | iOS |
| --- | --- |
| <img src="https://media.giphy.com/media/uyjCH8dwRpIsO7ZJm2/giphy-downsized-large.gif" width="150"> | <img src="https://media.giphy.com/media/MBNHOkKGEIrT4NJacq/giphy.gif" width="150"> |


## Getting started

`$ npm install react-native-image-cropview --save`

or

`$ yarn add  react-native-image-cropview`

### Additional steps
#### If you have react-native-gesture-handler installed ignore this step.

`$ npm install react-native-gesture-handler --save`

or

`$ yarn add  react-native-gesture-handler`


#### IOS
No additional step is required.

#### Android
No additional step is required.

## Usage

Import Cropper from `react-native-image-cropview`:

```javascript
import { Cropper } from 'react-native-image-cropview';
```

Create state which will be used to keep the image uri or import from other source

```javascript
const [imageUri, setImageUri] = useState();
```

Add `Cropper` like this:

```javascript

{
  !!imageUri && (
    <Cropper
      uri={imageUri}
      onDone={onCropDone}
      onCancel={onCropCancel}
      onReset={onReset}
      getImageSize={getImageSize}
    />
  )
}
```
See [Options](#options) for further information on `options`.

If you want to call done/cancel/reset programmatically, pass ref to `Cropper`:

```javascript
const cropperRef = useRef();

function done() {
  cropperRef.current.done();
}

function cancel() {
  cropperRef.current.cancel();
}

function reset() {
  cropperRef.current.reset();
}

function getImageSize() {
  // Use any method to find the original image width and height
  return {
    width,
    height
  }
}

return (
  <Cropper
    ref={cropperRef}
    uri={imageUri}
    onDone={onCropDone}
    onCancel={onCropCancel}
    onReset={onReset}
    hideFooter={true}
    getImageSize={getImageSize}
  />
)
```
See [Available Methods](#available-methods) for further information.

Done `callback` will be called with a response object, refer to [Response Object](#response-object).

## Options

| Option         | Required | Description                                                                                                                               |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| uri            | Yes      | Show the image specified by the URI param.                                                                                                |
| getImageSize   | Yes      | A method to provide the original image width and height to the cropper. Feel free to use any method to get the original image width and height; Example: https://www.npmjs.com/package/react-native-image-size
| onDone         | No      | Callback invoked when cropping is done                                                                                                         |
| onCancel       | No      | Callback invoked on cancel                                                                                                                     |
| onReset        | No      | Callback invoked on cropping reset                                                                                                             |
| aspectRatio    | No      | The aspect ratio of cropping area: Example: `original`, `4/3`, `2/3`, `16/9` ...                                                               |
| rounded        | No      | Use round cropping area                                                                                                                        |
| scaleMax       | No      | Maximum image scale of the image. Example: `scaleMax={3}` where scale `scaleMax <= 20` and `scaleMax >= 3`                                     |
| hideFooter     | No      | Hide all the cropper actions                                                                                                                   |


## Response Object
| key          | Description                                                          |
| ------------ | -------------------------------------------------------------------  |
| width        | width of cropping rectangle relative to the original image size      |
| height       | height of cropping rectangle relative to the original image size     |
| x            | x position of cropping rectangle relative to the original image size |
| y            | y position of cropping rectangle relative to the original image size |


## Available Methods
| Method       | Description                              |
| ------------ | -----------------------------------------|
| done         | Programmatically call cropping done      |
| cancel       | Programmatically call cancel             |
| reset        | Programmatically call reset              |

For more advanced usage check our [example app](/example/src/screens).