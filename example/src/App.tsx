import React, {useState} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './screens/Home';
import CircleCrop from './screens/CircleCrop';
import FreeCrop from './screens/FreeCrop';
import AspectRatioCrop from './screens/AspectRatioCrop';
import CustomActions from './screens/CustomActions';

export type RootStackParamList = {
  Home: undefined;
  CircleCrop: undefined;
  FreeCrop: undefined;
  AspectRatioCrop: undefined;
  CustomActions: undefined;
};

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="CircleCrop" options={{ title: "Circle Cropper" }} component={CircleCrop} />
        <Stack.Screen name="FreeCrop" options={{ title: "Free Cropper" }}   component={FreeCrop} />
        <Stack.Screen name="AspectRatioCrop" options={{ title: "Aspect Ratio Cropper" }} component={AspectRatioCrop} />
        <Stack.Screen name="CustomActions" options={{ title: "Custom Actions Cropper" }} component={CustomActions} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App;