/**
 * screens/DriverDashboard.js — Driver Operational Screen
 *
 * Designed for one-handed, outdoors, time-pressured use.
 * Key Features:
 *   1. QR Scan / Join Queue via camera or rank selection
 *   2. Real-time queue position & estimated wait time
 *   3. Visually dominant "DEPART" button (one-tap, thumb-reachable)
 *   4. Trip history log
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase, callEdgeFunction } from '../lib/supabaseClient';
import { enqueue, useSyncStatus } from '../lib/offlineQueue';
import SyncBanner from '../components/ui/SyncBanner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Colors, Typography, Spacing, Radius } from '../lib/theme';
import { ESTIMATED_LOAD_MINUTES } from '../lib/constants';

export default function DriverDashboard({ navigation }) {
  const { driver, logout } = useAuth();
  const syncStatus = useSyncStatus();

  const [activeEntry, setActiveEntry] = useState(null); // current queue entry
  const [position, setPosition]       = useState(null);
  const [ranks, setRanks]             = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionBusy, setActionBusy]   = useState(false);
  const [history, setHistory]         = useState([]);

  // Load ranks & current queue status for this driver's taxi
  useEffect(() => {
    if (!driver) return;
    loadRanks();
    checkDriverStatus();
    loadHistory();
  }, [driver]);

  const loadRanks = async () => {
    const { data } = await supabase.from('ranks').select('*');
    if (data && data.length > 0) {
      setRanks(data);
      setSelectedRank(data[0]);
    }
  };

  const loadHistory = async () => {
    if (!driver) return;
    const { data } = await supabase
      .from('queue_entries')
      .select('id, joined_at, departed_at, status, ranks(rank_name)')
      .eq('taxi_id', driver.id)
      .eq('status', 'departed')
      .order('departed_at', { ascending: false })
      .limit(5);
    if (data) setHistory(data);
  };

  const checkDriverStatus = async () => {
    if (!driver) return;
    setLoading(true);
    const { data } = await supabase
      .from('queue_entries')
      .select('id, queue_position, status, rank_id, ranks(rank_name)')
      .eq('taxi_id', driver.id)
      .in('status', ['waiting', 'loading'])
      .maybeSingle();

    if (data) {
      setActiveEntry(data);
      setPosition(data.queue_position);
    } else {
      setActiveEntry(null);
      setPosition(null);
    }
    setLoading(false);
  };

  // Real-time subscription to queue changes for driver's current entry
  useEffect(() => {
    if (!driver || !activeEntry) return;

    const sub = supabase.channel(`driver-queue-${driver.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
        filter: `rank_id=eq.${activeEntry.rank_id}`
      }, async () => {
        checkDriverStatus();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [driver, activeEntry]);

  // Join Queue Action
  const handleJoinQueue = async () => {
    if (!selectedRank) {
      Alert.alert('Select Rank', 'Please select a taxi rank first.');
      return;
    }
    setActionBusy(true);
    try {
      // 1. Verify / generate QR token via Edge Function
      const { error: qrError } = await callEdgeFunction('generate-qr-token', {
        action: 'verify',
        rank_id: selectedRank.id,
      });

      // Insert into queue_entries (DB trigger auto calculates queue_position)
      const { data, error } = await supabase.from('queue_entries').insert({
        rank_id: selectedRank.id,
        taxi_id: driver.id,
        status: 'waiting',
      }).select('*, ranks(rank_name)').single();

      if (error) throw error;

      setActiveEntry(data);
      setPosition(data.queue_position);
      Alert.alert('Joined Queue!', `You are position #${data.queue_position} at ${selectedRank.rank_name}.`);
    } catch (err) {
      // Fallback to offline queue enqueue if network fails
      await enqueue({
        table: 'queue_entries',
        op: 'insert',
        payload: { rank_id: selectedRank.id, taxi_id: driver.id, status: 'waiting' }
      });
      Alert.alert('Saved Offline', 'Queue join request recorded locally. Will sync when online.');
    } finally {
      setActionBusy(false);
    }
  };

  // One-tap DEPART Action (Visually dominant)
  const handleDepart = async () => {
    if (!activeEntry) return;
    setActionBusy(true);
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({
          status: 'departed',
          departed_at: new Date().toISOString(),
        })
        .eq('id', activeEntry.id);

      if (error) throw error;

      setActiveEntry(null);
      setPosition(null);
      loadHistory();
      Alert.alert('Departed!', 'Trip logged successfully. Standby for next queue join.');
    } catch (err) {
      await enqueue({
        table: 'queue_entries',
        op: 'update',
        payload: { status: 'departed', departed_at: new Date().toISOString() },
        match: { id: activeEntry.id }
      });
      setActiveEntry(null);
      setPosition(null);
      Alert.alert('Saved Offline', 'Departure logged offline and queued for sync.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SyncBanner status={syncStatus} />

      <View style={styles.header}>
        <View>
          <Text style={styles.driverName}>{driver?.driver_name || 'Driver'}</Text>
          <Text style={styles.regNum}>{driver?.registration_number || 'Taxi'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: Spacing.lg }}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : activeEntry ? (
          /* ACTIVE QUEUE STATE */
          <View style={styles.activeContainer}>
            <Card elevated style={styles.statusCard}>
              <Text style={styles.statusRank}>{activeEntry.ranks?.rank_name || 'Rank Queue'}</Text>
              
              <View style={styles.posBadge}>
                <Text style={styles.posLabel}>QUEUE POSITION</Text>
                <Text style={styles.posNumber}>#{position || activeEntry.queue_position}</Text>
              </View>

              <View style={styles.waitRow}>
                <Feather name="clock" size={16} color={Colors.textSecondary} />
                <Text style={styles.waitText}>
                  Est. Wait: ~{((position || 1) - 1) * ESTIMATED_LOAD_MINUTES} mins
                </Text>
              </View>
            </Card>

            {/* DOMINANT DEPART BUTTON */}
            <View style={styles.departWrap}>
              <TouchableOpacity
                style={[styles.departBtn, actionBusy && styles.btnDisabled]}
                onPress={handleDepart}
                disabled={actionBusy}
                activeOpacity={0.8}
              >
                {actionBusy ? (
                  <ActivityIndicator color={Colors.bgBase} size="large" />
                ) : (
                  <>
                    <Feather name="navigation" size={32} color={Colors.bgBase} />
                    <Text style={styles.departBtnText}>LEAVE RANK / DEPART</Text>
                    <Text style={styles.departSubtext}>Tap when vehicle is loaded and departing</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* NOT IN QUEUE STATE */
          <View style={styles.joinContainer}>
            <Card style={styles.joinCard}>
              <Feather name="qr-code" size={48} color={Colors.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.cardTitle}>Join Taxi Rank Queue</Text>
              <Text style={styles.cardDesc}>Select your rank and scan in or tap join to enter the active queue.</Text>

              <Text style={styles.label}>Select Current Rank</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {ranks.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.chip, selectedRank?.id === r.id && styles.chipActive]}
                      onPress={() => setSelectedRank(r)}
                    >
                      <Text style={[styles.chipText, selectedRank?.id === r.id && styles.chipTextActive]}>
                        {r.rank_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Button
                label="JOIN QUEUE NOW"
                size="lg"
                onPress={handleJoinQueue}
                loading={actionBusy}
                icon={<Feather name="log-in" size={20} color={Colors.bgBase} />}
              />
            </Card>

            {/* TRIP HISTORY */}
            {history.length > 0 && (
              <View style={{ marginTop: Spacing.xl }}>
                <Text style={styles.sectionLabel}>Recent Departures</Text>
                <Card>
                  {history.map((item, idx) => (
                    <View key={item.id} style={[styles.histRow, idx < history.length - 1 && styles.divider]}>
                      <View>
                        <Text style={styles.histRank}>{item.ranks?.rank_name || 'Trip'}</Text>
                        <Text style={styles.histTime}>
                          {item.departed_at ? new Date(item.departed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                      <View style={styles.histBadge}>
                        <Text style={styles.histBadgeText}>Completed</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  driverName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  regNum: { fontSize: Typography.size.sm, color: Colors.accent, fontWeight: Typography.weight.semibold },
  logoutBtn: { padding: Spacing.xs },
  body: { flex: 1 },
  activeContainer: { gap: Spacing.lg },
  statusCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  statusRank: { fontSize: Typography.size.lg, color: Colors.textSecondary, marginBottom: Spacing.sm },
  posBadge: {
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  posLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary, letterSpacing: 1, fontWeight: Typography.weight.semibold },
  posNumber: { fontSize: 48, fontWeight: Typography.weight.black, color: Colors.accent },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waitText: { fontSize: Typography.size.sm, color: Colors.textSecondary },

  /* DEPART BUTTON — VISUALLY DOMINANT */
  departWrap: { marginTop: Spacing.md },
  departBtn: {
    minHeight: 140,
    backgroundColor: Colors.success,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    elevation: 8,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  departBtnText: {
    color: Colors.bgBase,
    fontSize: 22,
    fontWeight: Typography.weight.black,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  departSubtext: {
    color: Colors.bgBase,
    opacity: 0.8,
    fontSize: Typography.size.xs,
    marginTop: 4,
    fontWeight: Typography.weight.medium,
  },
  btnDisabled: { opacity: 0.5 },

  joinContainer: { gap: Spacing.lg },
  joinCard: { padding: Spacing.lg },
  cardTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  cardDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  label: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: Typography.weight.semibold },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgBase,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  chipTextActive: { color: Colors.bgBase, fontWeight: Typography.weight.bold },

  sectionLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  histRank: { fontSize: Typography.size.md, color: Colors.textPrimary, fontWeight: Typography.weight.semibold },
  histTime: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  histBadge: { backgroundColor: Colors.bgElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  histBadgeText: { fontSize: Typography.size.xs, color: Colors.success },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
});
