import React from 'react';
import { Button as ReactButton, ButtonProps, View, ViewStyle } from 'react-native';

interface ButtonP extends ButtonProps {
  style: ViewStyle
}

const Button: React.FC<ButtonP> = (props) => {
  return (
    <View style={[props.style]}>
      <ReactButton {...props} />
    </View>
  )
}

export default Button;