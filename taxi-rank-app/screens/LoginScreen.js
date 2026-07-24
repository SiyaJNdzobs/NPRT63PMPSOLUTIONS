import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const success = await login(email, password, role);
    if (success) {
      switch (role.toLowerCase()) {
        case 'admin':
          navigation.navigate('AdminDashboard');
          break;
        case 'owner':
          navigation.navigate('OwnerDashboard');
          break;
        case 'marshal':
          navigation.navigate('MarshalDashboard');
          break;
        case 'driver':
          navigation.navigate('DriverDashboard');
          break;
        case 'passenger':
          navigation.navigate('PassengerHome');
          break;
        default:
          Alert.alert('Error', 'Invalid role');
      }
    } else {
      Alert.alert('Error', 'Login failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Taxi Rank App Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Role (admin/owner/marshal/driver/passenger)"
        value={role}
        onChangeText={setRole}
        autoCapitalize="none"
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
