import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'
import { Text, TouchableOpacity, View, TextStyle } from 'react-native'

import styles from '../../styles'
import { FooterHandler } from '../../types'

interface FooterProps {
  onCancel: () => void
  onDone: () => void
  onReset: () => void
  hideResetButton?: boolean
  doneTextStyle?: TextStyle
}

const Footer: ForwardRefRenderFunction<FooterHandler, FooterProps> = (
  { onCancel, onDone, onReset, hideResetButton, doneTextStyle },
  ref
) => {
  const hitSlop = { top: 10, left: 10, right: 10, bottom: 10 }
  const [resetActive, setResetActive] = useState(false)

  useImperativeHandle(ref, () => ({
    setDoneActive: () => {},
    setResetActive: (state: boolean) => {
      setResetActive(state)
    },
  }))

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity hitSlop={hitSlop} onPress={onCancel}>
        <Text style={[styles.defaultText]}>Cancel</Text>
      </TouchableOpacity>

      {!hideResetButton && resetActive && (
        <TouchableOpacity hitSlop={hitSlop} onPress={onReset}>
          <Text
            style={[styles.defaultText, styles.resetText, styles.activeText]}
          >
            Reset
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity hitSlop={hitSlop} onPress={onDone}>
        <Text style={[styles.defaultText, doneTextStyle]}>Done</Text>
      </TouchableOpacity>
    </View>
  )
}

export default forwardRef(Footer)
