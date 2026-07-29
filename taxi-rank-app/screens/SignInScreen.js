/**
 * screens/SignInScreen.js — E-RANK Authentication Screen
 *
 * Structure:
 *   - 4-tab role selector (Admin / Owner / Marshal / Driver)
 *   - Fields change per role
 *   - Rate limit countdown on block
 *   - Owner sign-up link (Owner tab only)
 *   - Plain-language errors only
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Colors, Typography, Spacing, Radius } from '../lib/theme';

const ROLES = [
  { key: 'admin',   label: 'Admin' },
  { key: 'owner',   label: 'Owner' },
  { key: 'marshal', label: 'Marshal' },
  { key: 'driver',  label: 'Driver' },
];

export default function SignInScreen({ navigation }) {
  const { loginAdmin, loginStaff, loginDriver, registerOwner } = useAuth();

  const [activeRole, setActiveRole] = useState('admin');
  const [email,      setEmail]      = useState('');
  const [cell,       setCell]       = useState('');
  const [password,   setPassword]   = useState('');
  const [pin,        setPin]        = useState('');
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');
  const [blocked,    setBlocked]    = useState(false);
  const [countdown,  setCountdown]  = useState(0);

  // Sign-up modal state
  const [showSignUp,     setShowSignUp]     = useState(false);
  const [suName,         setSuName]         = useState('');
  const [suCell,         setSuCell]         = useState('');
  const [suPass,         setSuPass]         = useState('');
  const [suPassConfirm,  setSuPassConfirm]  = useState('');
  const [suError,        setSuError]        = useState('');
  const [suBusy,         setSuBusy]         = useState(false);
  const [suSuccess,      setSuSuccess]      = useState(false);

  // Rate limit countdown timer
  useEffect(() => {
    if (countdown <= 0) { setBlocked(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resetFields = () => {
    setEmail(''); setCell(''); setPassword(''); setPin(''); setError('');
  };

  const handleRoleChange = (role) => {
    setActiveRole(role);
    resetFields();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (blocked) return;
    setError('');
    setBusy(true);
    try {
      let role;
      if (activeRole === 'admin')   role = await loginAdmin(email, password);
      if (activeRole === 'owner')   role = await loginStaff(cell, password, 'owner');
      if (activeRole === 'marshal') role = await loginStaff(cell, password, 'marshal');
      if (activeRole === 'driver')  role = await loginDriver(cell, pin);
      // Navigation handled by App.js via auth state change
    } catch (err) {
      if (err.code === 'RATE_LIMITED') {
        setBlocked(true);
        setCountdown(15 * 60); // 15 minutes
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Owner sign-up ──────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    setSuError('');
    if (!suName.trim() || !suCell.trim() || !suPass || !suPassConfirm) {
      setSuError('Please fill in all fields.'); return;
    }
    if (suPass !== suPassConfirm) {
      setSuError('Passwords do not match.'); return;
    }
    if (suPass.length < 6) {
      setSuError('Password must be at least 6 characters.'); return;
    }
    setSuBusy(true);
    try {
      await registerOwner(suName, suCell, suPass);
      setSuSuccess(true);
    } catch (err) {
      setSuError(err.message);
    } finally {
      setSuBusy(false);
    }
  };

  const closeSignUp = () => {
    setShowSignUp(false);
    setSuName(''); setSuCell(''); setSuPass(''); setSuPassConfirm('');
    setSuError(''); setSuSuccess(false);
    if (activeRole !== 'owner') setActiveRole('owner');
  };

  // ── Auto-submit on PIN complete ────────────────────────────────────────────
  const handlePINComplete = (value) => {
    setPin(value);
    // small delay so the 6th dot renders before submit
    setTimeout(handleSignIn, 150);
  };

  const fmtCountdown = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.logo}>E-RANK</Text>
            <Text style={styles.logoSub}>Digital Taxi Rank System</Text>
          </View>

          {/* ── Role selector ──────────────────────────────────────────── */}
          <View style={styles.roleRow}>
            {ROLES.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.roleTab, activeRole === key && styles.roleTabActive]}
                onPress={() => handleRoleChange(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeRole === key }}
              >
                <Text style={[styles.roleLabel, activeRole === key && styles.roleLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Form card ──────────────────────────────────────────────── */}
          <Card style={styles.card}>

            {activeRole === 'admin' && (
              <>
                <Input label="Email Address" value={email} onChangeText={setEmail}
                  placeholder="admin@example.com" keyboardType="email-address" />
                <Input label="Password" value={password} onChangeText={setPassword}
                  placeholder="Password" secureTextEntry />
              </>
            )}

            {(activeRole === 'owner' || activeRole === 'marshal') && (
              <>
                <Input label="Cell Number" value={cell} onChangeText={setCell}
                  placeholder="0821234567" keyboardType="phone-pad"
                  validateCell maxLength={10} />
                <Input label="Password" value={password} onChangeText={setPassword}
                  placeholder="Password" secureTextEntry />
              </>
            )}

            {activeRole === 'driver' && (
              <>
                <Input label="Cell Number" value={cell} onChangeText={setCell}
                  placeholder="0821234567" keyboardType="phone-pad"
                  validateCell maxLength={10} />
                <Input label="6-Digit PIN" value={pin} onChangeText={setPin}
                  placeholder="••••••" isPIN onPINComplete={handlePINComplete} />
              </>
            )}

            {/* Error or rate-limit block */}
            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>
                  {error}
                  {blocked && countdown > 0 ? ` (${fmtCountdown(countdown)})` : ''}
                </Text>
              </View>
            ) : null}

            <Button
              label={activeRole === 'driver' ? 'Verify PIN' : 'Sign In'}
              onPress={handleSignIn}
              loading={busy}
              disabled={blocked}
              style={{ marginTop: Spacing.xs }}
            />

            {/* Owner-only sign-up link */}
            {activeRole === 'owner' && (
              <TouchableOpacity
                style={styles.signUpLink}
                onPress={() => setShowSignUp(true)}
              >
                <Text style={styles.signUpLinkText}>
                  New owner? <Text style={styles.signUpLinkAccent}>Register here</Text>
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* ── Passenger access link ──────────────────────────────────── */}
          <TouchableOpacity
            style={styles.passengerLink}
            onPress={() => navigation.navigate('PassengerHome')}
          >
            <Text style={styles.passengerLinkText}>Continue as Passenger</Text>
            <Feather name="arrow-right" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Owner Sign-Up Modal ─────────────────────────────────────────── */}
      <Modal visible={showSignUp} transparent animationType="slide" onRequestClose={closeSignUp}>
        <View style={styles.modalOverlay}>
          <Card elevated style={styles.modalCard}>
            {suSuccess ? (
              <>
                <Feather name="check-circle" size={40} color={Colors.success} style={styles.successIcon} />
                <Text style={styles.modalTitle}>Account Created</Text>
                <Text style={styles.modalBody}>You can now sign in with the Owner tab.</Text>
                <Button label="Back to Sign In" onPress={closeSignUp} style={{ marginTop: Spacing.md }} />
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Register as Owner</Text>
                  <TouchableOpacity onPress={closeSignUp} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Input label="Full Name" value={suName} onChangeText={setSuName} placeholder="Sipho Dlamini" />
                <Input label="Cell Number" value={suCell} onChangeText={setSuCell}
                  placeholder="0821234567" keyboardType="phone-pad" validateCell maxLength={10} />
                <Input label="Password" value={suPass} onChangeText={setSuPass}
                  placeholder="Password" secureTextEntry />
                <Input label="Confirm Password" value={suPassConfirm} onChangeText={setSuPassConfirm}
                  placeholder="Re-enter password" secureTextEntry />
                {suError ? (
                  <Text style={styles.errorText}>{suError}</Text>
                ) : null}
                <Button label="Create Account" onPress={handleSignUp} loading={suBusy}
                  style={{ marginTop: Spacing.xs }} />
              </>
            )}
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo:   { fontSize: Typography.size.hero, fontWeight: Typography.weight.black, color: Colors.textPrimary, letterSpacing: 6 },
  logoSub:{ fontSize: Typography.size.sm, color: Colors.textSecondary, letterSpacing: 1, marginTop: 4 },

  roleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  roleTab:        { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  roleTabActive:  { backgroundColor: Colors.bgElevated, borderBottomWidth: 2, borderBottomColor: Colors.accent },
  roleLabel:      { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
  roleLabelActive:{ color: Colors.accent },

  card: { gap: Spacing.xs },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  errorText: { fontSize: Typography.size.sm, color: Colors.error, flex: 1 },

  signUpLink: { alignItems: 'center', marginTop: Spacing.md },
  signUpLinkText: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  signUpLinkAccent: { color: Colors.accent, fontWeight: Typography.weight.semibold },

  passengerLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: Spacing.xl,
  },
  passengerLinkText: { color: Colors.textSecondary, fontSize: Typography.size.sm },

  modalOverlay:  { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard:     { margin: Spacing.md, padding: Spacing.lg },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle:    { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  modalBody:     { color: Colors.textSecondary, fontSize: Typography.size.md, textAlign: 'center', marginVertical: Spacing.md },
  successIcon:   { alignSelf: 'center', marginBottom: Spacing.md },
});
