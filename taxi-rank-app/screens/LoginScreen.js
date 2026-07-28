/**
 * LoginScreen.js
 * ──────────────
 * Handles sign-in for all five user roles:
 *
 *   Owner / Marshal / Admin  → cell number + password  (Supabase Auth)
 *   Driver                   → cell number + 6-digit PIN  (taxis table)
 *   Passenger                → no login, tap "Continue as Passenger"
 *
 * Role is detected automatically from the DB after successful auth –
 * the user never has to type their role.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// ── Login modes ───────────────────────────────────────────────────────────────
const MODE_STAFF    = 'staff';   // owner / marshal / admin
const MODE_DRIVER   = 'driver';
const MODE_PASSENGER = 'passenger';

export default function LoginScreen({ navigation }) {
  const { login, loginDriver } = useAuth();

  const [mode,       setMode]       = useState(MODE_STAFF);
  const [cellNumber, setCellNumber] = useState('');
  const [password,   setPassword]   = useState('');
  const [pin,        setPin]        = useState('');
  const [busy,       setBusy]       = useState(false);

  // ── Staff login (owner / marshal / admin) ─────────────────────────────────
  const handleStaffLogin = async () => {
    if (!cellNumber.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your cell number and password.');
      return;
    }
    setBusy(true);
    try {
      const role = await login(cellNumber, password);
      navigateByRole(role);
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  // ── Driver login (PIN) ────────────────────────────────────────────────────
  const handleDriverLogin = async () => {
    if (!cellNumber.trim() || pin.length < 6) {
      Alert.alert('Missing fields', 'Enter your cell number and 6-digit PIN.');
      return;
    }
    setBusy(true);
    try {
      await loginDriver(cellNumber, pin);
      navigation.replace('DriverDashboard');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  // ── Passenger (no auth) ───────────────────────────────────────────────────
  const handlePassenger = () => {
    navigation.replace('PassengerHome');
  };

  // ── Navigate to the correct dashboard after staff login ───────────────────
  const navigateByRole = (role) => {
    const routes = {
      admin:   'AdminDashboard',
      owner:   'OwnerDashboard',
      marshal: 'MarshalDashboard',
    };
    const route = routes[role];
    if (route) {
      navigation.replace(route);
    } else {
      Alert.alert('Unknown role', `Role "${role}" has no dashboard. Contact admin.`);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Text style={styles.appName}>E-RANK</Text>
        <Text style={styles.tagline}>Digital Taxi Rank System</Text>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          {[
            { key: MODE_STAFF,     label: 'Staff' },
            { key: MODE_DRIVER,    label: 'Driver' },
            { key: MODE_PASSENGER, label: 'Passenger' },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
              onPress={() => { setMode(key); setCellNumber(''); setPassword(''); setPin(''); }}
            >
              <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── STAFF FORM ────────────────────────────────────────────────── */}
        {mode === MODE_STAFF && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Owner / Marshal / Admin</Text>

            <Text style={styles.label}>Cell Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0821234567"
              placeholderTextColor="#64748b"
              value={cellNumber}
              onChangeText={setCellNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
              maxLength={10}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={handleStaffLogin}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── DRIVER FORM ───────────────────────────────────────────────── */}
        {mode === MODE_DRIVER && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Driver  •  Cell Number + PIN</Text>

            <Text style={styles.label}>Driver Cell Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0720000001"
              placeholderTextColor="#64748b"
              value={cellNumber}
              onChangeText={setCellNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
              maxLength={10}
            />

            <Text style={styles.label}>6-Digit PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor="#64748b"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={handleDriverLogin}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Enter Queue Dashboard</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── PASSENGER ────────────────────────────────────────────────── */}
        {mode === MODE_PASSENGER && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No login required</Text>
            <Text style={styles.passengerNote}>
              Browse queue boards, check estimated wait times, submit feedback,
              and join late-trip pooling — all without an account.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handlePassenger}>
              <Text style={styles.primaryBtnText}>Continue as Passenger</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const NAVY  = '#1e3a5f';
const GREEN = '#28a745';
const BG    = '#0b0f19';
const CARD  = '#0f172a';
const BORDER = '#1e293b';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: NAVY,
  },
  modeBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modeBtnTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 16,
  },
  primaryBtn: {
    height: 50,
    backgroundColor: NAVY,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: GREEN,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  passengerNote: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
});
