import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import OwnerDashboard from './screens/OwnerDashboard';
import MarshalDashboard from './screens/MarshalDashboard';
import DriverDashboard from './screens/DriverDashboard';
import PassengerHome from './screens/PassengerHome';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} options={{ title: 'Owner Dashboard' }} />
          <Stack.Screen name="MarshalDashboard" component={MarshalDashboard} options={{ title: 'Marshal Dashboard' }} />
          <Stack.Screen name="DriverDashboard" component={DriverDashboard} options={{ title: 'Driver Dashboard' }} />
          <Stack.Screen name="PassengerHome" component={PassengerHome} options={{ title: 'Passenger Home' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
