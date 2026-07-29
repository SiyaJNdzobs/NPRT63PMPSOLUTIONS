/**
 * screens/OwnerDashboard.js — Taxi Owner Fleet Management
 *
 * Features:
 *   1. Fleet Overview: total vehicles, total trips today, total revenue today.
 *   2. Register New Taxi & Generate Driver PIN (One-time modal display with WhatsApp link).
 *   3. Fleet Vehicle List with real-time stats.
 *   4. Rank Feedback Submission module.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase, callEdgeFunction } from '../lib/supabaseClient';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import SyncBanner from '../components/ui/SyncBanner';
import { useSyncStatus } from '../lib/offlineQueue';
import { Colors, Typography, Spacing, Radius } from '../lib/theme';
import { CELL_REGEX, REVIEW_CATEGORIES, buildWhatsAppLink } from '../lib/constants';

export default function OwnerDashboard({ navigation }) {
  const { profile, logout } = useAuth();
  const syncStatus = useSyncStatus();

  const [taxis, setTaxis]         = useState([]);
  const [ranks, setRanks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New taxi form state
  const [regNum, setRegNum]       = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverCell, setDriverCell] = useState('');
  const [selectedRank, setSelectedRank] = useState(null);
  const [addBusy, setAddBusy]     = useState(false);

  // Generated PIN Modal state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [generatedPin, setGeneratedPin]       = useState('');
  const [pinTargetDriver, setPinTargetDriver] = useState('');
  const [pinTargetCell, setPinTargetCell]     = useState('');

  // Review state
  const [reviewRank, setReviewRank]         = useState(null);
  const [reviewCat, setReviewCat]           = useState(REVIEW_CATEGORIES[0]);
  const [reviewRating, setReviewRating]     = useState(5);
  const [reviewComment, setReviewComment]   = useState('');
  const [reviewBusy, setReviewBusy]         = useState(false);

  useEffect(() => {
    loadOwnerData();
  }, [profile]);

  const loadOwnerData = async () => {
    setLoading(true);
    // 1. Fetch ranks for dropdown
    const { data: rData } = await supabase.from('ranks').select('*');
    if (rData) {
      setRanks(rData);
      if (rData.length > 0) {
        setSelectedRank(rData[0]);
        setReviewRank(rData[0]);
      }
    }

    // 2. Fetch owner's taxis
    if (profile?.id) {
      const { data: tData } = await supabase
        .from('taxis')
        .select('*, ranks(rank_name)')
        .eq('owner_id', profile.id);
      if (tData) setTaxis(tData);
    }
    setLoading(false);
  };

  // Add Taxi + Generate PIN
  const handleAddTaxi = async () => {
    if (!regNum.trim() || !driverName.trim() || !CELL_REGEX.test(driverCell) || !selectedRank) {
      Alert.alert('Missing Fields', 'Please complete all fields with a valid registration number and SA cell number.');
      return;
    }
    setAddBusy(true);
    try {
      // 1. Insert taxi
      const { data: taxi, error: insertErr } = await supabase
        .from('taxis')
        .insert({
          registration_number: regNum.trim().toUpperCase(),
          driver_name: driverName.trim(),
          driver_cell: driverCell.trim(),
          rank_id: selectedRank.id,
          owner_id: profile.id,
        })
        .select('*')
        .single();

      if (insertErr) throw insertErr;

      // 2. Call Edge Function to generate 6-digit PIN & hash it
      const { data: pinData, error: pinErr } = await callEdgeFunction('generate-driver-pin', {
        taxi_id: taxi.id,
      });

      const pin = pinData?.pin || Math.floor(100000 + Math.random() * 900000).toString();

      // Show PIN modal once
      setGeneratedPin(pin);
      setPinTargetDriver(driverName);
      setPinTargetCell(driverCell);
      setPinModalVisible(true);

      // Reset form & reload fleet
      setRegNum(''); setDriverName(''); setDriverCell('');
      setShowAddModal(false);
      loadOwnerData();
    } catch (err) {
      Alert.alert('Error Adding Taxi', err.message);
    } finally {
      setAddBusy(false);
    }
  };

  // Submit Feedback
  const handleSubmitReview = async () => {
    if (!reviewRank) {
      Alert.alert('Error', 'Please select a rank to review.');
      return;
    }
    setReviewBusy(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        rank_id: reviewRank.id,
        category: reviewCat,
        rating: reviewRating,
        comment: reviewComment.trim(),
        author_role: 'owner',
        author_ref: profile.id,
      });
      if (error) throw error;

      Alert.alert('Feedback Submitted', 'Thank you for your feedback.');
      setReviewComment('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setReviewBusy(false);
    }
  };

  // Share PIN via WhatsApp
  const handleSharePin = () => {
    const msg = `Hello ${pinTargetDriver}, your E-RANK temporary driver PIN is: ${generatedPin}. Download the app and sign in with your cell number.`;
    const waUrl = buildWhatsAppLink(pinTargetCell, msg);
    Linking.openURL(waUrl).catch(() => Alert.alert('Error', 'WhatsApp not available.'));
  };

  // Fleet Totals
  const totalTrips = taxis.reduce((acc, t) => acc + (t.total_trips_today || 0), 0);
  const totalRevenue = taxis.reduce((acc, t) => acc + (t.total_revenue_today || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <SyncBanner status={syncStatus} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fleet Dashboard</Text>
          <Text style={styles.subTitle}>{profile?.full_name || 'Owner'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
        {/* STATS OVERVIEW */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statVal}>{taxis.length}</Text>
            <Text style={styles.statLbl}>Vehicles</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statVal}>{totalTrips}</Text>
            <Text style={styles.statLbl}>Trips Today</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.accent }]}>R{totalRevenue}</Text>
            <Text style={styles.statLbl}>Revenue Today</Text>
          </Card>
        </View>

        {/* ADD TAXI BUTTON */}
        <Button
          label="Add New Taxi & Driver"
          icon={<Feather name="plus-circle" size={18} color={Colors.bgBase} />}
          onPress={() => setShowAddModal(true)}
        />

        {/* FLEET LIST */}
        <View>
          <Text style={styles.sectionTitle}>Fleet Vehicles ({taxis.length})</Text>
          {loading ? (
            <Card><Text style={styles.mutedText}>Loading fleet...</Text></Card>
          ) : taxis.length === 0 ? (
            <Card><Text style={styles.mutedText}>No taxis registered yet. Tap button above to add one.</Text></Card>
          ) : (
            taxis.map((t) => (
              <Card key={t.id} elevated style={styles.taxiCard}>
                <View style={styles.taxiHeader}>
                  <View>
                    <Text style={styles.taxiReg}>{t.registration_number}</Text>
                    <Text style={styles.taxiDriver}>{t.driver_name} • {t.driver_cell}</Text>
                  </View>
                  <View style={styles.rankTag}>
                    <Text style={styles.rankTagText}>{t.ranks?.rank_name || 'Rank'}</Text>
                  </View>
                </View>

                <View style={styles.taxiFooter}>
                  <Text style={styles.taxiStat}>Trips Today: <Text style={{ color: Colors.textPrimary }}>{t.total_trips_today || 0}</Text></Text>
                  <Text style={styles.taxiStat}>Revenue: <Text style={{ color: Colors.accent }}>R{t.total_revenue_today || 0}</Text></Text>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* FEEDBACK SUBMISSION */}
        <Card style={{ gap: Spacing.xs, marginTop: Spacing.md }}>
          <Text style={styles.cardTitle}>Submit Rank Feedback</Text>
          <Text style={styles.cardSub}>Report issues or suggestions regarding rank operations.</Text>

          <Text style={styles.label}>Select Rank</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {ranks.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.chip, reviewRank?.id === r.id && styles.chipActive]}
                  onPress={() => setReviewRank(r)}
                >
                  <Text style={[styles.chipText, reviewRank?.id === r.id && styles.chipTextActive]}>{r.rank_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input label="Comment" value={reviewComment} onChangeText={setReviewComment} placeholder="Describe operational feedback..." />

          <Button label="Submit Feedback" onPress={handleSubmitReview} loading={reviewBusy} />
        </Card>
      </ScrollView>

      {/* ADD TAXI MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <Card elevated style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Vehicle & Driver</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input label="Vehicle Registration Number" value={regNum} onChangeText={setRegNum} placeholder="e.g. GP 123 NW" autoCapitalize="characters" />
            <Input label="Driver Full Name" value={driverName} onChangeText={setDriverName} placeholder="Sbusiso Ndlovu" />
            <Input label="Driver Cell Number" value={driverCell} onChangeText={setDriverCell} placeholder="0721234567" keyboardType="phone-pad" validateCell maxLength={10} />

            <Text style={styles.label}>Assign Rank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {ranks.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.chip, selectedRank?.id === r.id && styles.chipActive]}
                    onPress={() => setSelectedRank(r)}
                  >
                    <Text style={[styles.chipText, selectedRank?.id === r.id && styles.chipTextActive]}>{r.rank_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Button label="Register & Generate PIN" onPress={handleAddTaxi} loading={addBusy} />
          </Card>
        </View>
      </Modal>

      {/* ONE-TIME DRIVER PIN DISPLAY MODAL */}
      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card elevated style={[styles.modalCard, { alignItems: 'center', gap: Spacing.md }]}>
            <Feather name="key" size={48} color={Colors.accent} />
            <Text style={styles.modalTitle}>Driver PIN Generated</Text>
            <Text style={styles.cardSub}>Share this 6-digit PIN with {pinTargetDriver}. It will only be shown once.</Text>

            <View style={styles.pinBox}>
              <Text style={styles.pinText}>{generatedPin}</Text>
            </View>

            <Button
              label="Share via WhatsApp"
              variant="success"
              icon={<Feather name="message-circle" size={18} color={Colors.bgBase} />}
              onPress={handleSharePin}
            />

            <Button
              label="Close & Dismiss"
              variant="ghost"
              onPress={() => {
                setGeneratedPin('');
                setPinModalVisible(false);
              }}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgBase },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border
  },
  title: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  subTitle: { fontSize: Typography.size.sm, color: Colors.accent },
  logoutBtn: { padding: Spacing.xs },
  body: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.xs },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statVal: { fontSize: Typography.size.xl, fontWeight: Typography.weight.black, color: Colors.textPrimary },
  statLbl: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  mutedText: { color: Colors.textSecondary, textAlign: 'center', marginVertical: Spacing.sm },
  taxiCard: { marginBottom: Spacing.sm },
  taxiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  taxiReg: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  taxiDriver: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  rankTag: { backgroundColor: Colors.bgElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  rankTagText: { fontSize: Typography.size.xs, color: Colors.accent },
  taxiFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.xs },
  taxiStat: { fontSize: Typography.size.xs, color: Colors.textSecondary },

  cardTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  cardSub: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center' },
  label: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.semibold },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.bgBase, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  chipTextActive: { color: Colors.bgBase, fontWeight: Typography.weight.bold },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.lg },
  modalCard: { padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },

  pinBox: { backgroundColor: Colors.bgBase, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accent },
  pinText: { fontSize: 36, fontWeight: Typography.weight.black, color: Colors.accent, letterSpacing: 8 },
});
