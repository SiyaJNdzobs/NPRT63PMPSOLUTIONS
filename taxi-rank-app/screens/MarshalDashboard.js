import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function MarshalDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Marshal Dashboard</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Long-distance Manifests</Text>
        <Text style={styles.description}>Create and manage long-distance trip manifests</Text>
        <Button title="Create Manifest" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Updates</Text>
        <Text style={styles.description}>Broadcast updates to passengers and drivers</Text>
        <Button title="Send Update" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Queue Management</Text>
        <Text style={styles.description}>Monitor and manage taxi queues</Text>
        <Button title="View Queue" onPress={() => {}} />
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
