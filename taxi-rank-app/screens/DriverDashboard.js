import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function DriverDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Driver Dashboard</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Position Checker</Text>
        <Text style={styles.description}>Check your current position in the queue</Text>
        <Button title="Check Position" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Departure</Text>
        <Text style={styles.description}>Big tactile button to mark departure</Text>
        <View style={styles.departButton}>
          <Button title="DEPART" onPress={() => {}} color="#4CAF50" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip History</Text>
        <Text style={styles.description}>View your trip history</Text>
        <Button title="View History" onPress={() => {}} />
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
  departButton: {
    marginTop: 10,
    padding: 10,
  },
});
