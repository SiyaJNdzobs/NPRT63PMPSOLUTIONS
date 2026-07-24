import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function AdminDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rank Setup</Text>
        <Text style={styles.description}>Configure taxi rank settings and locations</Text>
        <Button title="Setup Rank" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QR Sign Download</Text>
        <Text style={styles.description}>Download printable QR codes for rank signage</Text>
        <Button title="Download QR Signs" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <Text style={styles.description}>Manage user accounts and permissions</Text>
        <Button title="Manage Users" onPress={() => {}} />
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
