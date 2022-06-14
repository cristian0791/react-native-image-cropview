import ImageSize from 'react-native-image-size';

export const getImageSize = async (uri: string): Promise<{ width: number; height: number; }> => {
  const size = await ImageSize.getSize(uri);

  let width = size.width;
  let height = size.height;

  // some android devices returns the image with rotation applied.
  // If the image is rotated switch width with height
  if (size.rotation === 90 || size.rotation === 270) {
    width = size.height;
    height = size.width;
  }

  return {
    width,
    height
  }
}