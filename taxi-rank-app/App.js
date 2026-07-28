/**
 * App.js  –  E-RANK Root Navigator
 * ──────────────────────────────────
 * Wraps the entire app in AuthProvider so every screen can access session
 * state via useAuth().  The Stack navigator starts at Login; each dashboard
 * uses navigation.replace() so the back button never returns to the login
 * screen after signing in.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen      from './screens/LoginScreen';
import AdminDashboard   from './screens/AdminDashboard';
import OwnerDashboard   from './screens/OwnerDashboard';
import MarshalDashboard from './screens/MarshalDashboard';
import DriverDashboard  from './screens/DriverDashboard';
import PassengerHome    from './screens/PassengerHome';

const Stack = createStackNavigator();

// ── Header options shared across all dashboards ───────────────────────────────
const dashboardOptions = (title) => ({
  title,
  headerStyle:     { backgroundColor: '#1e3a5f' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: 'bold' },
  headerBackVisible: false, // prevent navigating back to Login
});

// ── Loading spinner while session resolves ────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <ActivityIndicator size="large" color="#1e3a5f" />
    </View>
  );
}

// ── Inner component (needs AuthProvider above it) ─────────────────────────────
function RootNavigator() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>

        <Stack.Screen name="Login"           component={LoginScreen} />

        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={dashboardOptions('Admin  •  E-RANK')}
        />
        <Stack.Screen
          name="OwnerDashboard"
          component={OwnerDashboard}
          options={dashboardOptions('Owner  •  E-RANK')}
        />
        <Stack.Screen
          name="MarshalDashboard"
          component={MarshalDashboard}
          options={dashboardOptions('Marshal  •  E-RANK')}
        />
        <Stack.Screen
          name="DriverDashboard"
          component={DriverDashboard}
          options={dashboardOptions('Driver  •  E-RANK')}
        />
        <Stack.Screen
          name="PassengerHome"
          component={PassengerHome}
          options={dashboardOptions('E-RANK  •  Rank Info')}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── App entry point ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
