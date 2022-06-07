import React from 'react';
import { View } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from 'src/App';
import Button from '../components/Button';

const Home = ({
  navigation
}: NativeStackScreenProps<RootStackParamList, "Home">) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title="Free Cropper"
        onPress={() => navigation.navigate("FreeCrop")}
        style={{marginBottom: 10}}
      />

      <Button
        title="Aspect ratio Cropper"
        onPress={() => navigation.navigate("AspectRatioCrop")}
        style={{marginBottom: 10}}
      />

      <Button
        title="Circle Cropper"
        onPress={() => navigation.navigate("CircleCrop")}
        style={{marginBottom: 10}}
      />

      <Button
        title="Custom Actions Cropper"
        onPress={() => navigation.navigate("CustomActions")}
        style={{marginBottom: 10}}
      />
    </View>
  )
}

export default Home;
