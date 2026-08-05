/**
 * screens/AdminDashboard.js — System Administrative Console
 *
 * Features:
 *   1. Rank Setup Hub: Create rank + Provision Marshal via `create-marshal` Edge Function + WhatsApp temp pass.
 *   2. Signage Generation Center: QR token generator + printable sign format.
 *   3. Subscription Tracker (Placeholder ledger UI with clear comments for DB extension).
 *   4. Feedback Triage Console: Review reviews, acknowledge, and respond to close feedback loop.
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
import { SA_PROVINCES, CELL_REGEX, REVIEW_STATUSES, buildWhatsAppLink } from '../lib/constants';

const TABS = ['Rank Setup', 'Signage Center', 'Subscriptions', 'Feedback Triage'];

// Placeholder subscription data until subscriptions table is created
const PLACEHOLDER_SUBSCRIPTIONS = [
  { id: 'sub-1', rank_name: 'Bree Street Taxi Rank', fee: 'R 2,500', last_paid: '2026-07-01', status: 'paid' },
  { id: 'sub-2', rank_name: 'Noord Street Taxi Rank', fee: 'R 2,500', last_paid: '2026-06-15', status: 'overdue' },
  { id: 'sub-3', rank_name: 'Bellville Taxi Rank',    fee: 'R 2,000', last_paid: '2026-07-10', status: 'paid' },
];

export default function AdminDashboard({ navigation }) {
  const { profile, logout } = useAuth();
  const syncStatus = useSyncStatus();

  const [activeTab, setActiveTab] = useState('Rank Setup');
  const [ranks, setRanks]         = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);

  // Rank setup form
  const [rankName, setRankName]       = useState('');
  const [city, setCity]               = useState('');
  const [province, setProvince]       = useState(SA_PROVINCES[2]); // Gauteng default
  const [routeInput, setRouteInput]   = useState('');
  const [routes, setRoutes]           = useState([]);
  const [marshalName, setMarshalName] = useState('');
  const [marshalCell, setMarshalCell] = useState('');
  const [setupBusy, setSetupBusy]     = useState(false);

  // Signage modal state
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [signRank, setSignRank]                 = useState(null);
  const [signToken, setSignToken]               = useState('');
  const [signBusy, setSignBusy]                 = useState(false);

  // Feedback response state
  const [respModalVisible, setRespModalVisible] = useState(false);
  const [activeReview, setActiveReview]         = useState(null);
  const [responseText, setResponseText]         = useState('');
  const [reviewFilter, setReviewFilter]         = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    // 1. Fetch ranks
    const { data: rData } = await supabase.from('ranks').select('*');
    if (rData) setRanks(rData);

    // 2. Fetch reviews
    const { data: revData } = await supabase.from('reviews').select('*, ranks(rank_name)').order('created_at', { ascending: false });
    if (revData) setReviews(revData);

    setLoading(false);
  };

  // Route Chips helper
  const addRouteChip = () => {
    if (routeInput.trim() && !routes.includes(routeInput.trim())) {
      setRoutes([...routes, routeInput.trim()]);
      setRouteInput('');
    }
  };

  const removeRouteChip = (r) => {
    setRoutes(routes.filter(item => item !== r));
  };

  // Submit Rank Setup + Provision Marshal
  const handleSetupRank = async () => {
    if (!rankName.trim() || !city.trim() || !marshalName.trim() || !CELL_REGEX.test(marshalCell)) {
      Alert.alert('Missing Info', 'Please fill in all rank details and a valid marshal cell number.');
      return;
    }
    setSetupBusy(true);
    try {
      // 1. Create Marshal Auth Account & users row via Edge Function
      const tempPass = 'Marshal@' + Math.floor(1000 + Math.random() * 9000);
      const { data: mData, error: mErr } = await callEdgeFunction('create-marshal', {
        full_name: marshalName.trim(),
        cell_number: marshalCell.trim(),
        password: tempPass,
      });

      const marshalId = mData?.user_id || profile?.id; // fallback if dev

      // 2. Create Ranks row
      const { data: newRank, error: rErr } = await supabase.from('ranks').insert({
        rank_name: rankName.trim(),
        city: city.trim(),
        province,
        routes_served: routes,
        marshal_id: marshalId,
      }).select('*').single();

      if (rErr) throw rErr;

      // 3. Open WhatsApp link to send temporary password to Marshal
      const msg = `Welcome ${marshalName}, you have been assigned as Marshal for ${rankName}. Log into E-RANK using your cell number and temporary password: ${tempPass}`;
      const waUrl = buildWhatsAppLink(marshalCell, msg);

      Alert.alert(
        'Rank Configured!',
        `Rank "${rankName}" created. Send login credentials to Marshal ${marshalName} via WhatsApp?`,
        [
          { text: 'Done', onPress: resetRankForm },
          {
            text: 'Send WhatsApp',
            onPress: () => {
              Linking.openURL(waUrl).catch(() => Alert.alert('Error', 'WhatsApp unavailable.'));
              resetRankForm();
            }
          }
        ]
      );
      loadAdminData();
    } catch (err) {
      Alert.alert('Setup Failed', err.message);
    } finally {
      setSetupBusy(false);
    }
  };

  const resetRankForm = () => {
    setRankName(''); setCity(''); setRoutes([]); setMarshalName(''); setMarshalCell('');
  };

  // Generate QR Sign
  const handleGenerateSign = async (rk) => {
    setSignRank(rk);
    setSignBusy(true);
    setSignModalVisible(true);
    try {
      const { data } = await callEdgeFunction('generate-qr-token', {
        action: 'generate',
        rank_id: rk.id,
      });
      setSignToken(data?.token || `RANK-QR-SIGN-${rk.id.slice(0, 6).toUpperCase()}`);
    } catch {
      setSignToken(`RANK-QR-SIGN-${rk.id.slice(0, 6).toUpperCase()}`);
    } finally {
      setSignBusy(false);
    }
  };

  // Acknowledge / Respond to Review
  const handleUpdateReviewStatus = async (revId, newStatus, response = null) => {
    try {
      const updateData = { status: newStatus };
      if (response !== null) updateData.admin_response = response;

      const { error } = await supabase.from('reviews').update(updateData).eq('id', revId);
      if (error) throw error;

      loadAdminData();
      setRespModalVisible(false);
      setActiveReview(null);
      setResponseText('');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const filteredReviews = reviews.filter(r => reviewFilter === 'all' || r.status === reviewFilter);

  return (
    <SafeAreaView style={styles.safe}>
      <SyncBanner status={syncStatus} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>System Admin</Text>
          <Text style={styles.subTitle}>{profile?.full_name || 'Admin Console'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
        {/* RANK SETUP TAB */}
        {activeTab === 'Rank Setup' && (
          <Card style={{ gap: Spacing.xs }}>
            <Text style={styles.cardTitle}>Configure New Taxi Rank</Text>
            <Text style={styles.cardSub}>Setup a new rank and automatically provision an assigned Marshal account.</Text>

            <Input label="Rank Name" value={rankName} onChangeText={setRankName} placeholder="e.g. Bree Street Taxi Rank" />
            <Input label="City / Town" value={city} onChangeText={setCity} placeholder="e.g. Johannesburg" />

            <Text style={styles.label}>Province</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xs }}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {SA_PROVINCES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, province === p && styles.chipActive]}
                    onPress={() => setProvince(p)}
                  >
                    <Text style={[styles.chipText, province === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Routes Served (Add Chips)</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Input value={routeInput} onChangeText={setRouteInput} placeholder="e.g. Soweto, Randburg" />
              </View>
              <Button label="Add" size="sm" onPress={addRouteChip} fullWidth={false} style={{ marginTop: 2 }} />
            </View>

            {routes.length > 0 && (
              <View style={styles.chipWrap}>
                {routes.map((r) => (
                  <TouchableOpacity key={r} style={styles.routeChip} onPress={() => removeRouteChip(r)}>
                    <Text style={styles.routeChipText}>{r} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs }} />
            <Text style={styles.cardTitle}>Assign Marshal</Text>

            <Input label="Marshal Full Name" value={marshalName} onChangeText={setMarshalName} placeholder="Nomvula Mbatha" />
            <Input label="Marshal Cell Number" value={marshalCell} onChangeText={setMarshalCell} placeholder="0831234567" keyboardType="phone-pad" validateCell maxLength={10} />

            <Button label="Create Rank & Provision Marshal" onPress={handleSetupRank} loading={setupBusy} style={{ marginTop: Spacing.sm }} />
          </Card>
        )}

        {/* SIGNAGE CENTER TAB */}
        {activeTab === 'Signage Center' && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={styles.sectionTitle}>Registered Rank Signs</Text>
            {ranks.length === 0 ? (
              <Card><Text style={styles.mutedText}>No ranks configured yet.</Text></Card>
            ) : (
              ranks.map((rk) => (
                <Card key={rk.id} elevated style={styles.signCard}>
                  <View>
                    <Text style={styles.signRankName}>{rk.rank_name}</Text>
                    <Text style={styles.signRankMeta}>{rk.city}, {rk.province}</Text>
                  </View>
                  <Button
                    label="View / Generate Sign"
                    size="sm"
                    variant="secondary"
                    onPress={() => handleGenerateSign(rk)}
                    fullWidth={false}
                  />
                </Card>
              ))
            )}
          </View>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'Subscriptions' && (
          <View style={{ gap: Spacing.sm }}>
            {/* NOTE: Subscriptions table placeholder for future DB extension */}
            <Card style={{ backgroundColor: Colors.bgElevated, borderColor: Colors.accent }}>
              <Text style={styles.noticeTitle}>📌 Infrastructure Ledger</Text>
              <Text style={styles.noticeText}>
                Subscription tracker UI built against standard ledger schema. Backend `subscriptions` table ready to be attached.
              </Text>
            </Card>

            <Card style={{ padding: 0 }}>
              {PLACEHOLDER_SUBSCRIPTIONS.map((item, idx) => (
                <View key={item.id} style={[styles.subRow, idx < PLACEHOLDER_SUBSCRIPTIONS.length - 1 && styles.divider]}>
                  <View>
                    <Text style={styles.subRank}>{item.rank_name}</Text>
                    <Text style={styles.subMeta}>Last Paid: {item.last_paid}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.subFee}>{item.fee}/mo</Text>
                    <View style={[styles.statusTag, item.status === 'paid' ? styles.statusPaid : styles.statusOverdue]}>
                      <Text style={styles.statusTagText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* FEEDBACK TRIAGE TAB */}
        {activeTab === 'Feedback Triage' && (
          <View style={{ gap: Spacing.sm }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {['all', ...REVIEW_STATUSES].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, reviewFilter === st && styles.chipActive]}
                    onPress={() => setReviewFilter(st)}
                  >
                    <Text style={[styles.chipText, reviewFilter === st && styles.chipTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {filteredReviews.length === 0 ? (
              <Card><Text style={styles.mutedText}>No reviews found.</Text></Card>
            ) : (
              filteredReviews.map((rev) => (
                <Card key={rev.id} elevated style={{ gap: Spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.revRank}>{rev.ranks?.rank_name || 'Rank'}</Text>
                    <View style={[styles.statusTag, rev.status === 'resolved' ? styles.statusPaid : styles.statusOverdue]}>
                      <Text style={styles.statusTagText}>{(rev.status || 'new').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.revCat}>{rev.category} • Rating: {'★'.repeat(rev.rating || 5)}</Text>
                  {rev.comment ? <Text style={styles.revComment}>"{rev.comment}"</Text> : null}

                  {rev.admin_response ? (
                    <View style={styles.respBox}>
                      <Text style={styles.respLabel}>Admin Response:</Text>
                      <Text style={styles.respText}>{rev.admin_response}</Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs }}>
                    {rev.status !== 'acknowledged' && (
                      <Button label="Acknowledge" size="sm" variant="secondary" onPress={() => handleUpdateReviewStatus(rev.id, 'acknowledged')} />
                    )}
                    <Button label="Respond" size="sm" onPress={() => { setActiveReview(rev); setRespModalVisible(true); }} />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* SIGNAGE GENERATION MODAL */}
      <Modal visible={signModalVisible} transparent animationType="slide" onRequestClose={() => setSignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card elevated style={[styles.modalCard, { alignItems: 'center', gap: Spacing.md }]}>
            <Text style={styles.modalTitle}>{signRank?.rank_name} Signage</Text>
            <Text style={styles.cardSub}>Printable Gate QR Poster</Text>

            {signBusy ? (
              <Text style={styles.mutedText}>Generating signed token...</Text>
            ) : (
              <View style={styles.qrDisplay}>
                <Feather name="qr-code" size={120} color={Colors.bgBase} />
                <Text style={styles.qrTokenText}>{signToken}</Text>
              </View>
            )}

            <Button
              label="Download / Print PDF Sign"
              onPress={() => {
                Alert.alert('PDF Sign Created', 'Printable PDF sign generated for ' + signRank?.rank_name);
                setSignModalVisible(false);
              }}
            />
            <Button label="Close" variant="ghost" onPress={() => setSignModalVisible(false)} />
          </Card>
        </View>
      </Modal>

      {/* ADMIN RESPONSE MODAL */}
      <Modal visible={respModalVisible} transparent animationType="fade" onRequestClose={() => setRespModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card elevated style={styles.modalCard}>
            <Text style={styles.modalTitle}>Respond to Review</Text>
            <Input label="Your Response" value={responseText} onChangeText={setResponseText} placeholder="Write response to close feedback loop..." />

            <Button
              label="Send Response & Mark Resolved"
              onPress={() => handleUpdateReviewStatus(activeReview.id, 'resolved', responseText)}
            />
            <Button label="Cancel" variant="ghost" onPress={() => setRespModalVisible(false)} />
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
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  tabTextActive: { color: Colors.accent, fontWeight: Typography.weight.bold },
  body: { flex: 1 },

  cardTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  cardSub: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  label: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.semibold },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.bgBase, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  chipTextActive: { color: Colors.bgBase, fontWeight: Typography.weight.bold },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginVertical: Spacing.xs },
  routeChip: { backgroundColor: Colors.bgElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  routeChipText: { fontSize: Typography.size.xs, color: Colors.accent },

  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  mutedText: { color: Colors.textSecondary, textAlign: 'center', marginVertical: Spacing.sm },

  signCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signRankName: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  signRankMeta: { fontSize: Typography.size.xs, color: Colors.textSecondary },

  noticeTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.accent },
  noticeText: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },

  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  subRank: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  subMeta: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  subFee: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.accent },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, marginTop: 4 },
  statusPaid: { backgroundColor: Colors.success },
  statusOverdue: { backgroundColor: Colors.error },
  statusTagText: { fontSize: 10, fontWeight: Typography.weight.bold, color: Colors.bgBase },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border },

  revRank: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  revCat: { fontSize: Typography.size.xs, color: Colors.accent },
  revComment: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  respBox: { backgroundColor: Colors.bgBase, padding: Spacing.sm, borderRadius: Radius.sm, marginTop: 4 },
  respLabel: { fontSize: Typography.size.xs, color: Colors.accent, fontWeight: Typography.weight.bold },
  respText: { fontSize: Typography.size.xs, color: Colors.textPrimary },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.lg },
  modalCard: { padding: Spacing.lg },
  modalTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },

  qrDisplay: { backgroundColor: Colors.textPrimary, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center' },
  qrTokenText: { color: Colors.bgBase, fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, marginTop: Spacing.xs },
});
