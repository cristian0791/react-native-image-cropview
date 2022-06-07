import { StyleSheet } from 'react-native'

import { backdropColor, borderWidth, cornerSize } from './config'

export default StyleSheet.create({
  // global styles
  defaultText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  activeText: {
    color: 'rgb(255, 219, 13)',
  },
  inactiveText: {
    color: 'rgb(69, 69, 69)',
  },
  resetText: {
    textTransform: 'uppercase',
    fontSize: 13,
  },

  // Dynamic cropbox styles
  cropboxLoaderContainer: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  corner: {
    position: 'absolute',
    borderColor: '#FCFCFC',
    zIndex: 10,
    width: cornerSize,
    height: cornerSize,
    backgroundColor: 'transparent',
  },
  topLeftCorner: {
    borderTopWidth: borderWidth,
    borderLeftWidth: borderWidth,
  },
  topRightCorner: {
    borderTopWidth: borderWidth,
    borderRightWidth: borderWidth,
  },
  bottomLeftCorner: {
    borderBottomWidth: borderWidth,
    borderLeftWidth: borderWidth,
  },
  bottomRightCorner: {
    borderBottomWidth: borderWidth,
    borderRightWidth: borderWidth,
  },
  topLine: {
    borderTopWidth: borderWidth,
  },
  bottomLine: {
    borderBottomWidth: borderWidth,
  },
  leftLine: {
    borderLeftWidth: borderWidth,
  },
  rightLine: {
    borderRightWidth: borderWidth,
  },
  box: {
    borderWidth: 1,
    borderColor: 'yellow',
    zIndex: 10,
  },
  backdrop: {
    backgroundColor: backdropColor,
    position: 'absolute',
    zIndex: 1,
  },
  marginIndicator: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    zIndex: 11,
  },
  centerIndicators: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    zIndex: 9,
  },
  // cropper styles
  safeAreaContainer: {
    flex: 1,
    margin: 10,
    backgroundColor: 'transparent',
  },
  rootView: {
    flex: 1,
  },
  cropperContainer: {
    flex: 1,
    margin: 10,
  },
  footerContainer: {
    width: '100%',
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    height: 100,
  },
  // image styles
  imageContainer: {
    flex: 1,
    overflow: 'visible',
  },
})
