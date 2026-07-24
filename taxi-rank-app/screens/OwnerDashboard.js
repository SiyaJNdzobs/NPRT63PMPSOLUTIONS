import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function OwnerDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Owner Dashboard</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Setup</Text>
        <Text style={styles.description}>Register and manage your vehicles</Text>
        <Button title="Setup Vehicles" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password Management</Text>
        <Text style={styles.description}>Generate on-the-spot passwords for drivers</Text>
        <Button title="Generate Password" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Assignments</Text>
        <Text style={styles.description}>Assign drivers to vehicles</Text>
        <Button title="Manage Drivers" onPress={() => {}} />
      </View>

      <Button title="Logout" onPress={() => navigation.navigate('Login')} color="red" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});
