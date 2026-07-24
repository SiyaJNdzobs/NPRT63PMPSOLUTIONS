import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function PassengerHome({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Passenger Home</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info Display Board</Text>
        <Text style={styles.description}>View taxi rank information and availability</Text>
        <Button title="View Info Board" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Context Guide</Text>
        <Text style={styles.description}>Get AI-powered assistance for your journey</Text>
        <Button title="Ask AI Guide" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Late Pooling</Text>
        <Text style={styles.description}>Join late pooling for shared rides</Text>
        <Button title="Join Pool" onPress={() => {}} />
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
