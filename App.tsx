import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CameraScreen from './screens/CameraScreen';
import DetailScreen from './screens/DetailScreen';
import HomeScreen from './screens/HomeScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide the tab bar
          }}>
          <Tab.Screen
            name='Home'
            component={HomeScreen}
            options={{
              title: 'OCR History',
            }}
          />
          <Tab.Screen
            name='Camera'
            component={CameraScreen}
            options={{
              title: 'Scan Text',
            }}
          />
          <Tab.Screen
            name='Detail'
            component={DetailScreen}
            options={{
              title: 'OCR Details',
            }}
          />
        </Tab.Navigator>
        <StatusBar style='dark' backgroundColor='#ffffff' />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
