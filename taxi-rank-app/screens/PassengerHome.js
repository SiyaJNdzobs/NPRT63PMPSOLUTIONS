/**
 * screens/PassengerHome.js — Default landing screen (no login required)
 *
 * Sections:
 *   1. Public queue status board (live, per rank)
 *   2. AI assistant text box (stub — backend integration pending)
 *   3. Late-trip pool booking form
 *   4. One-tap 1–5 star feedback rating
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { callEdgeFunction } from '../lib/supabaseClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Colors, Typography, Spacing, Radius } from '../lib/theme';
import { CELL_REGEX, ESTIMATED_LOAD_MINUTES, buildWhatsAppLink } from '../lib/constants';

const TABS = ['Queue', 'Book Late Trip', 'Feedback'];

export default function PassengerHome({ navigation }) {
  const [activeTab,   setActiveTab]   = useState('Queue');
  const [ranks,       setRanks]       = useState([]);
  const [selectedRank,setSelectedRank]= useState(null);
  const [queue,       setQueue]       = useState([]);
  const [loadingQ,    setLoadingQ]    = useState(false);
  const [aiQuery,     setAiQuery]     = useState('');

  // Late pool form
  const [lpDest,      setLpDest]      = useState('');
  const [lpCell,      setLpCell]      = useState('');
  const [lpBusy,      setLpBusy]      = useState(false);

  // Feedback
  const [fbRating,    setFbRating]    = useState(0);
  const [fbBusy,      setFbBusy]      = useState(false);
  const [fbDone,      setFbDone]      = useState(false);

  // ── Load all ranks ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('ranks').select('id, rank_name, city, province, routes_served')
      .then(({ data }) => { if (data) setRanks(data); });
  }, []);

  // ── Load & subscribe to queue for selected rank ────────────────────────
  useEffect(() => {
    if (!selectedRank) return;
    setLoadingQ(true);

    supabase.from('queue_entries')
      .select('id, queue_position, status, driver_cell')
      .eq('rank_id', selectedRank.id)
      .in('status', ['waiting', 'loading'])
      .order('queue_position')
      .then(({ data }) => { setQueue(data ?? []); setLoadingQ(false); });

    const sub = supabase.channel(`queue-${selectedRank.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries',
          filter: `rank_id=eq.${selectedRank.id}` },
        () => {
          supabase.from('queue_entries')
            .select('id, queue_position, status, driver_cell')
            .eq('rank_id', selectedRank.id)
            .in('status', ['waiting', 'loading'])
            .order('queue_position')
            .then(({ data }) => setQueue(data ?? []));
        })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [selectedRank]);

  // ── Late-trip booking ──────────────────────────────────────────────────
  const handleLatePool = async () => {
    if (!lpDest.trim() || !CELL_REGEX.test(lpCell)) {
      Alert.alert('Check your details', 'Enter a destination and a valid cell number.');
      return;
    }
    setLpBusy(true);
    try {
      // Query existing booking for this destination & rank
      const { data: existing } = await supabase
        .from('late_trip_bookings')
        .select('*')
        .eq('destination', lpDest.trim())
        .eq('rank_id', selectedRank?.id ?? null)
        .eq('is_confirmed', false)
        .maybeSingle();

      let bookingId;
      if (existing) {
        bookingId = existing.id;
        const updatedCells = [...(existing.passenger_cells || []), lpCell.trim()];
        await supabase
          .from('late_trip_bookings')
          .update({ passenger_cells: updatedCells })
          .eq('id', existing.id);
      } else {
        const { data: newBooking, error } = await supabase
          .from('late_trip_bookings')
          .insert({
            destination: lpDest.trim(),
            rank_id: selectedRank?.id ?? null,
            passenger_cells: [lpCell.trim()],
          })
          .select('id')
          .single();
        if (error) throw error;
        bookingId = newBooking.id;
      }

      // Try confirming (threshold check in Edge Function)
      await callEdgeFunction('confirm-late-trip', { booking_id: bookingId });

      setLpDest(''); setLpCell('');
      Alert.alert('Booked!', "You're on the list. We'll notify you once 5 passengers join.");
    } catch {
      Alert.alert('Error', 'Could not submit booking. Please try again.');
    } finally {
      setLpBusy(false);
    }
  };

  // ── Anonymous star rating ──────────────────────────────────────────────
  const handleFeedback = async (stars) => {
    setFbRating(stars);
    setFbBusy(true);
    try {
      await supabase.from('reviews').insert({
        rating: stars,
        category: 'General Feedback',
        comment: '',
        author_role: 'passenger',
        author_ref: null,
        rank_id: selectedRank?.id ?? null,
      });
      setFbDone(true);
    } catch {
      Alert.alert('Error', 'Could not submit feedback.');
    } finally {
      setFbBusy(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────
  const renderQueueRow = ({ item, index }) => {
    const estWait = index * ESTIMATED_LOAD_MINUTES;
    return (
      <View style={styles.queueRow}>
        <View style={styles.queuePos}>
          <Text style={styles.queueNum}>{item.queue_position}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.queueReg}>Driver: {item.driver_cell}</Text>
        </View>
        <View style={styles.queueRight}>
          <Text style={styles.queueStatus}>{item.status}</Text>
          <Text style={styles.queueWait}>~{estWait} min</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── App bar ──────────────────────────────────────────────────── */}
      <View style={styles.appBar}>
        <Text style={styles.appBarLogo}>E-RANK</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.staffLink}>
          <Text style={styles.staffLinkText}>Staff Login</Text>
          <Feather name="log-in" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: Spacing.md }}>

        {/* ── QUEUE TAB ──────────────────────────────────────────────── */}
        {activeTab === 'Queue' && (
          <>
            {/* Rank picker */}
            <Text style={styles.sectionLabel}>Select Rank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {ranks.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rankChip, selectedRank?.id === r.id && styles.rankChipActive]}
                    onPress={() => setSelectedRank(r)}
                  >
                    <Text style={[styles.rankChipText, selectedRank?.id === r.id && styles.rankChipTextActive]}>
                      {r.rank_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {ranks.length === 0 && <Text style={styles.muted}>No ranks available yet.</Text>}
              </View>
            </ScrollView>

            {selectedRank && (
              <>
                <Card style={styles.rankInfo}>
                  <Text style={styles.rankName}>{selectedRank.rank_name}</Text>
                  <Text style={styles.rankMeta}>{selectedRank.city}, {selectedRank.province}</Text>
                  {selectedRank.routes_served?.length > 0 && (
                    <View style={styles.routeChips}>
                      {selectedRank.routes_served.map((r) => (
                        <View key={r} style={styles.routeChip}>
                          <Text style={styles.routeChipText}>{r}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>

                <Text style={styles.sectionLabel}>Live Queue — {queue.length} vehicle{queue.length !== 1 ? 's' : ''}</Text>

                {loadingQ ? (
                  <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.lg }} />
                ) : queue.length === 0 ? (
                  <Text style={styles.muted}>No vehicles in queue right now.</Text>
                ) : (
                  <Card>
                    {queue.map((item, i) => (
                      <React.Fragment key={item.id}>
                        {renderQueueRow({ item, index: i })}
                        {i < queue.length - 1 && <View style={styles.divider} />}
                      </React.Fragment>
                    ))}
                  </Card>
                )}
              </>
            )}

            {/* AI assistant stub */}
            <Card style={{ marginTop: Spacing.lg }}>
              <View style={styles.aiHeader}>
                <Feather name="message-circle" size={16} color={Colors.accent} />
                <Text style={styles.aiTitle}>Ask about fares & routes</Text>
              </View>
              <TextInput
                style={styles.aiInput}
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholder="e.g. How much to Johannesburg CBD?"
                placeholderTextColor={Colors.textDisabled}
                multiline
              />
              {/* TODO: Wire to AI backend — currently a UI stub */}
              <Button label="Ask" variant="secondary" onPress={() =>
                Alert.alert('Coming soon', 'AI assistant integration is being set up.')
              } />
            </Card>
          </>
        )}

        {/* ── LATE TRIP TAB ───────────────────────────────────────────── */}
        {activeTab === 'Book Late Trip' && (
          <Card>
            <Text style={styles.cardTitle}>After-Hours Pool Booking</Text>
            <Text style={styles.cardBody}>
              Get 5 passengers together and we'll dispatch a taxi for you — at a small premium.
            </Text>
            <Input
              label="Destination"
              value={lpDest}
              onChangeText={setLpDest}
              placeholder="e.g. Soweto"
            />
            <Input
              label="Your Cell Number"
              value={lpCell}
              onChangeText={setLpCell}
              placeholder="0821234567"
              keyboardType="phone-pad"
              validateCell
              maxLength={10}
            />
            <Button label="Join the Pool" onPress={handleLatePool} loading={lpBusy} />
          </Card>
        )}

        {/* ── FEEDBACK TAB ───────────────────────────────────────────── */}
        {activeTab === 'Feedback' && (
          <Card>
            <Text style={styles.cardTitle}>Rate Your Experience</Text>
            <Text style={styles.cardBody}>
              One tap — no account needed. Helps improve the service.
            </Text>
            {fbDone ? (
              <View style={styles.fbDone}>
                <Feather name="check-circle" size={32} color={Colors.success} />
                <Text style={styles.fbDoneText}>Thank you for your feedback!</Text>
              </View>
            ) : (
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleFeedback(s)}
                    disabled={fbBusy}
                    style={styles.starBtn}
                    accessibilityLabel={`Rate ${s} star${s > 1 ? 's' : ''}`}
                  >
                    <Feather
                      name={s <= fbRating ? 'star' : 'star'}
                      size={36}
                      color={s <= fbRating ? Colors.accent : Colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bgBase },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
            borderBottomWidth: 1, borderBottomColor: Colors.border },
  appBarLogo: { fontSize: Typography.size.xl, fontWeight: Typography.weight.black,
                color: Colors.textPrimary, letterSpacing: 4 },
  staffLink:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  staffLinkText: { fontSize: Typography.size.xs, color: Colors.textSecondary },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:    { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabLabel:  { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  tabLabelActive: { color: Colors.accent },

  body: { flex: 1 },
  sectionLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
                  color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  muted: { color: Colors.textSecondary, fontSize: Typography.size.md },

  rankChip:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                  backgroundColor: Colors.bgCard, borderRadius: Radius.full,
                  borderWidth: 1, borderColor: Colors.border },
  rankChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  rankChipText:   { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  rankChipTextActive: { color: Colors.bgBase },

  rankInfo:   { marginBottom: Spacing.md },
  rankName:   { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  rankMeta:   { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  routeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.xs },
  routeChip:  { backgroundColor: Colors.bgElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  routeChipText: { fontSize: Typography.size.xs, color: Colors.textSecondary },

  queueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  queuePos: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgElevated,
              justifyContent: 'center', alignItems: 'center' },
  queueNum:    { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.accent },
  queueReg:    { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  queueDriver: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  queueRight:  { alignItems: 'flex-end' },
  queueStatus: { fontSize: Typography.size.xs, color: Colors.success, textTransform: 'capitalize' },
  queueWait:   { fontSize: Typography.size.xs, color: Colors.textSecondary },
  divider:     { height: 1, backgroundColor: Colors.border },

  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.xs },
  aiTitle:  { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  aiInput:  { color: Colors.textPrimary, fontSize: Typography.size.md, minHeight: 60,
              borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
              padding: Spacing.sm, marginBottom: Spacing.sm, backgroundColor: Colors.bgBase },

  cardTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold,
               color: Colors.textPrimary, marginBottom: Spacing.xs },
  cardBody:  { fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 22 },

  starRow:  { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginVertical: Spacing.md },
  starBtn:  { padding: Spacing.xs },
  fbDone:   { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  fbDoneText: { fontSize: Typography.size.md, color: Colors.success },
});
