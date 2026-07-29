/**
 * screens/SetPermanentCredential.js
 *
 * Mandatory first-login screen for Marshal (new password) and Driver (new PIN).
 * Cannot be skipped, dismissed, or navigated away from.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Colors, Typography, Spacing } from '../lib/theme';

export default function SetPermanentCredential() {
  const { profile, driver, completePasswordReset, completePINReset, logout } = useAuth();

  const isDriver = !!driver && !profile;
  const label    = isDriver ? 'PIN' : 'password';

  const [cred,        setCred]        = useState('');
  const [credConfirm, setCredConfirm] = useState('');
  const [error,       setError]       = useState('');
  const [busy,        setBusy]        = useState(false);

  const validate = () => {
    if (isDriver) {
      if (cred.length !== 6) return 'PIN must be exactly 6 digits.';
      if (cred !== credConfirm) return 'PINs do not match.';
    } else {
      if (cred.length < 8) return 'Password must be at least 8 characters.';
      if (cred !== credConfirm) return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setBusy(true);
    setError('');
    try {
      if (isDriver) await completePINReset(cred);
      else          await completePasswordReset(cred);
      // After reset, auth state change will re-render App.js to the correct dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Feather name="lock" size={40} color={Colors.accent} style={styles.icon} />

        <Text style={styles.title}>Set Your {isDriver ? 'Permanent PIN' : 'Permanent Password'}</Text>
        <Text style={styles.body}>
          You were given a temporary {label} to get you started.{'\n'}
          Choose a new one — you will use it every time you log in.
        </Text>

        <Card style={styles.card}>
          {isDriver ? (
            <>
              <Input
                label="New 6-Digit PIN"
                value={cred}
                onChangeText={setCred}
                isPIN
                placeholder="••••••"
              />
              <Input
                label="Confirm PIN"
                value={credConfirm}
                onChangeText={setCredConfirm}
                isPIN
                placeholder="••••••"
              />
            </>
          ) : (
            <>
              <Input
                label="New Password"
                value={cred}
                onChangeText={setCred}
                secureTextEntry
                placeholder="At least 8 characters"
              />
              <Input
                label="Confirm Password"
                value={credConfirm}
                onChangeText={setCredConfirm}
                secureTextEntry
                placeholder="Re-enter password"
              />
            </>
          )}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            label={`Save ${isDriver ? 'PIN' : 'Password'}`}
            onPress={handleSubmit}
            loading={busy}
            style={{ marginTop: Spacing.xs }}
          />
        </Card>

        {/* Allow logout — but not dashboard access — this screen cannot be bypassed */}
        <Button
          label="Cancel & Sign Out"
          variant="ghost"
          onPress={logout}
          style={{ marginTop: Spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bgBase },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  icon:      { alignSelf: 'center', marginBottom: Spacing.md },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  card:      { gap: Spacing.xs },
  errorText: { fontSize: Typography.size.sm, color: Colors.error, marginTop: 4 },
});
