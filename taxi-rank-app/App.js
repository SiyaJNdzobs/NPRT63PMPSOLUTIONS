/**
 * App.js — E-RANK Root Navigation & Route Protection Architecture
 *
 * Routing Rules (per spec):
 *   1. Default landing experience for unauthenticated users is PassengerHome (no login gate).
 *   2. Staff Login button on PassengerHome routes to SignInScreen.
 *   3. After login:
 *      - If forceReset is true (first login for Marshal/Driver), user is forced into SetPermanentCredential screen.
 *      - Otherwise, user is routed directly to their role's dashboard (Admin, Owner, Marshal, Driver).
 *   4. Each dashboard route verifies role; mismatch or missing role redirects to SignInScreen.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './context/AuthContext';
import SignInScreen           from './screens/SignInScreen';
import SetPermanentCredential from './screens/SetPermanentCredential';
import AdminDashboard        from './screens/AdminDashboard';
import OwnerDashboard        from './screens/OwnerDashboard';
import MarshalDashboard      from './screens/MarshalDashboard';
import DriverDashboard       from './screens/DriverDashboard';
import PassengerHome         from './screens/PassengerHome';
import { Colors }            from './lib/theme';

const Stack = createStackNavigator();

// Header options for role dashboards
const dashboardOptions = (title) => ({
  title,
  headerStyle: { backgroundColor: Colors.bgBase },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: 'bold' },
  headerBackVisible: false, // Prevent back navigation to login
});

function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

function RootNavigator() {
  const { session, profile, driver, loading, forceReset } = useAuth();

  if (loading) return <LoadingScreen />;

  // 1. Mandatory First-Login Credential Reset Guard
  if (forceReset) {
    return <SetPermanentCredential />;
  }

  // Determine active role
  const role = profile?.role || (driver ? 'driver' : null);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={role ? getDashboardName(role) : "PassengerHome"}
        screenOptions={{ headerShown: false }}
      >
        {/* PUBLIC PASSENGER LANDING */}
        <Stack.Screen name="PassengerHome" component={PassengerHome} />

        {/* AUTH SIGN IN */}
        <Stack.Screen name="SignIn" component={SignInScreen} />

        {/* ROLE DASHBOARDS */}
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={dashboardOptions('Admin Console')}
        />
        <Stack.Screen
          name="OwnerDashboard"
          component={OwnerDashboard}
          options={dashboardOptions('Owner Fleet')}
        />
        <Stack.Screen
          name="MarshalDashboard"
          component={MarshalDashboard}
          options={dashboardOptions('Marshal Operations')}
        />
        <Stack.Screen
          name="DriverDashboard"
          component={DriverDashboard}
          options={dashboardOptions('Driver Portal')}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function getDashboardName(role) {
  switch (role) {
    case 'admin':   return 'AdminDashboard';
    case 'owner':   return 'OwnerDashboard';
    case 'marshal': return 'MarshalDashboard';
    case 'driver':  return 'DriverDashboard';
    default:        return 'PassengerHome';
  }
}

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
    backgroundColor: Colors.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
});