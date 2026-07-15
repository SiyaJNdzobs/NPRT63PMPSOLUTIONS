import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { mockDatabase } from '../db';

// QR Code image for Bree Street/Kimberley CBD Rank
const MOCK_QR_CODE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export default function App() {
  const [cellNumber, setCellNumber] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('taxis'); // passenger/admin tabs

  // Form states
  const [regNumber, setRegNumber] = useState('');
  const [capacity, setCapacity] = useState('15');
  const [driverName, setDriverName] = useState('');
  const [driverCell, setDriverCell] = useState('');
  const [fare, setFare] = useState('25');
  const [selectedRank, setSelectedRank] = useState(mockDatabase.ranks[0].rankName);

  // Active news / reviews lists
  const [newsList, setNewsList] = useState(mockDatabase.news);
  const [reviewsList, setReviewsList] = useState(mockDatabase.reviews);
  const [taxisList, setTaxisList] = useState(mockDatabase.taxis);
  const [queuesList, setQueuesList] = useState(mockDatabase.queues);

  // Review states
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Login handler using cellNumber + password
  const handleLogin = () => {
    if (!cellNumber || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const matchedUser = mockDatabase.users.find(
      u => u.cellNumber === cellNumber && u.password === password
    );

    if (matchedUser) {
      setUser(matchedUser);
      // Set appropriate default tab based on role
      if (matchedUser.role === 'admin') setTab('ranks');
      else if (matchedUser.role === 'marshal') setTab('queue');
      else if (matchedUser.role === 'owner') setTab('my-fleet');
      else if (matchedUser.role === 'passenger') setTab('taxis');
    } else {
      Alert.alert("Login Failed", "Invalid cell phone number or password.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCellNumber('');
    setPassword('');
  };

  // Add Taxi (Owner Dashboard)
  const handleAddTaxi = () => {
    if (!regNumber || !driverName || !driverCell) {
      Alert.alert("Error", "Please fill in all taxi fields.");
      return;
    }
    const newTaxi = {
      taxiId: `taxi-${Date.now()}`,
      registrationNumber: regNumber,
      ownerName: user.fullName,
      driverName,
      driverCell,
      capacity: parseInt(capacity) || 15,
      rankName: selectedRank,
      isAvailable: true,
      totalRides: 0,
      fare: parseFloat(fare) || 25
    };
    setTaxisList([...taxisList, newTaxi]);
    Alert.alert("Success", "Taxi registered successfully!");
    setRegNumber('');
    setDriverName('');
    setDriverCell('');
  };

  // Submit Review (Passenger Dashboard)
  const handleSubmitReview = () => {
    if (!reviewComment) {
      Alert.alert("Error", "Please enter a comment.");
      return;
    }
    const newReview = {
      reviewId: `rev-${Date.now()}`,
      userName: user.fullName,
      rating: reviewRating,
      comment: reviewComment,
      rankName: selectedRank
    };
    setReviewsList([newReview, ...reviewsList]);
    setReviewComment('');
    Alert.alert("Thank you", "Your review has been submitted.");
  };

  // Marshal / Dispatch Taxi
  const handleDispatch = (queueId: string) => {
    const queueEntry = queuesList.find(q => q.queueId === queueId);
    if (!queueEntry) return;

    // Remove from queue and mark taxi on route
    setQueuesList(queuesList.filter(q => q.queueId !== queueId));
    setTaxisList(taxisList.map(t => t.taxiId === queueEntry.taxiId ? { ...t, isAvailable: false, totalRides: t.totalRides + 1 } : t));

    // Shift other drivers up in queue
    setQueuesList(prev => prev.map((q, idx) => ({ ...q, queuePosition: idx + 1 })));
    Alert.alert("Dispatched", "Taxi has been loaded and dispatched!");
  };

  // Join Queue (For drivers / simulated actions)
  const handleJoinQueue = (taxiId: string) => {
    const taxi = taxisList.find(t => t.taxiId === taxiId);
    if (!taxi) return;

    // Check if already in queue
    if (queuesList.some(q => q.taxiId === taxiId)) {
      Alert.alert("Alert", "Taxi is already in the queue.");
      return;
    }

    const newQueue = {
      queueId: `q-${Date.now()}`,
      taxiId: taxi.taxiId,
      rankId: "rank-bree",
      rankName: taxi.rankName,
      driverName: taxi.driverName,
      queuePosition: queuesList.length + 1,
      status: "waiting",
      joinedAt: new Date().toISOString()
    };
    setQueuesList([...queuesList, newQueue]);
    Alert.alert("Success", "Driver added to queue.");
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>E-RANK</Text>
        {user && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>

      {!user ? (
        /* ── SIGN IN SCREEN ── */
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Sign In</Text>
            <Text style={styles.loginSubtitle}>Access your E-Rank mobile account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cell Phone Number</Text>
              <TextInput
                style={styles.input}
                value={cellNumber}
                onChangeText={setCellNumber}
                placeholder="e.g. 0820000001"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.testAccountsCard}>
              <Text style={styles.testAccountTitle}>Test Credentials</Text>
              <Text style={styles.testAccountText}>• Admin: <Text style={styles.codeText}>0820000001</Text> / <Text style={styles.codeText}>Sasingenje@25</Text></Text>
              <Text style={styles.testAccountText}>• Owner: <Text style={styles.codeText}>0821234567</Text> / <Text style={styles.codeText}>Mageza@25</Text></Text>
              <Text style={styles.testAccountText}>• Marshal: <Text style={styles.codeText}>0829876543</Text> / <Text style={styles.codeText}>Mageza@25</Text></Text>
              <Text style={styles.testAccountText}>• Passenger: <Text style={styles.codeText}>0711122334</Text> / <Text style={styles.codeText}>Mageza@25</Text></Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ── ROLE DASHBOARDS ── */
        <View style={{ flex: 1 }}>
          {/* Admin Navigation */}
          {user.role === 'admin' && (
            <View style={styles.tabBar}>
              <TouchableOpacity onPress={() => setTab('ranks')} style={[styles.tabButton, tab === 'ranks' && styles.tabButtonActive]}>
                <Text style={[styles.tabText, tab === 'ranks' && styles.tabTextActive]}>Ranks</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('all-taxis')} style={[styles.tabButton, tab === 'all-taxis' && styles.tabButtonActive]}>
                <Text style={[styles.tabText, tab === 'all-taxis' && styles.tabTextActive]}>Taxis</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('system-news')} style={[styles.tabButton, tab === 'system-news' && styles.tabButtonActive]}>
                <Text style={[styles.tabText, tab === 'system-news' && styles.tabTextActive]}>Announcements</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Passenger Navigation */}
          {user.role === 'passenger' && (
            <View style={styles.tabBar}>
              <TouchableOpacity onPress={() => setTab('taxis')} style={[styles.tabButton, tab === 'taxis' && styles.tabButtonActive]}>
                <Text style={[styles.tabText, tab === 'taxis' && styles.tabTextActive]}>Find Taxi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('news')} style={[styles.tabButton, tab === 'news' && styles.tabButtonActive]}>
                <Text style={[styles.tabText, tab === 'news' && styles.tabTextActive]}>Announcements</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('reviews')} style={[styles.tabButton, tab === 'reviews' && styles.tabButtonActive]}>
                <Text style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}>Feedback</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.dashboardContent}>
            {/* ── ADMIN INTERFACE ── */}
            {user.role === 'admin' && tab === 'ranks' && (
              <View>
                <Text style={styles.sectionTitle}>Taxi Ranks Control</Text>
                {mockDatabase.ranks.map((r, i) => (
                  <View key={i} style={styles.card}>
                    <Text style={styles.cardHeader}>{r.rankName}</Text>
                    <Text style={styles.cardBody}>{r.city}, {r.province}</Text>
                    
                    {/* Visual QR Poster Code */}
                    <View style={styles.qrContainer}>
                      <View style={styles.qrHeader}>
                        <Text style={styles.qrHeaderTitle}>E-RANK</Text>
                        <Text style={styles.qrHeaderSubtitle}>Scan to Join the Queue</Text>
                      </View>
                      
                      {/* Simple Simulated QR Code Pattern */}
                      <View style={styles.simulatedQRCode}>
                        <View style={styles.qrFinderPattern} />
                        <View style={[styles.qrFinderPattern, { position: 'absolute', right: 12, top: 12 }]} />
                        <View style={[styles.qrFinderPattern, { position: 'absolute', left: 12, bottom: 12 }]} />
                        <View style={{ width: 140, height: 140, alignSelf: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#0b0f19', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>KIMBERLEY CBD{"\n"}QR QUEUE</Text>
                        </View>
                      </View>
                      
                      <View style={styles.qrFooter}>
                        <Text style={styles.qrFooterTitle}>{r.rankName} • Drivers Only</Text>
                        <Text style={styles.qrFooterWarning}>Do NOT modify or duplicate this QR code</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {user.role === 'admin' && tab === 'all-taxis' && (
              <View>
                <Text style={styles.sectionTitle}>Registered Taxis</Text>
                {taxisList.map((t, i) => (
                  <View key={i} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'between' }}>
                      <Text style={styles.cardHeader}>{t.registrationNumber}</Text>
                      <Text style={{ color: t.isAvailable ? '#28a745' : '#ffc107', fontWeight: 'bold' }}>
                        {t.isAvailable ? 'Available' : 'On Route'}
                      </Text>
                    </View>
                    <Text style={styles.cardBody}>Driver: {t.driverName}</Text>
                    <Text style={styles.cardBody}>Owner: {t.ownerName}</Text>
                    <Text style={styles.cardBody}>Location: {t.rankName}</Text>
                  </View>
                ))}
              </View>
            )}

            {user.role === 'admin' && tab === 'system-news' && (
              <View>
                <Text style={styles.sectionTitle}>Publish Announcement</Text>
                <View style={styles.card}>
                  <Text style={styles.cardBody}>Create notices for passengers and drivers across the ranks.</Text>
                </View>
              </View>
            )}

            {/* ── PASSENGER INTERFACE ── */}
            {user.role === 'passenger' && tab === 'taxis' && (
              <View>
                <Text style={styles.sectionTitle}>Active Rank Queues</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Departure Rank</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                    {mockDatabase.ranks.map((r, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.badgeButton, selectedRank === r.rankName && styles.badgeButtonActive]}
                        onPress={() => setSelectedRank(r.rankName)}
                      >
                        <Text style={[styles.badgeText, selectedRank === r.rankName && styles.badgeTextActive]}>
                          {r.rankName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {taxisList.filter(t => t.rankName === selectedRank).map((t, i) => (
                  <View key={i} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.cardHeader}>{t.registrationNumber}</Text>
                      <Text style={styles.fareText}>R {t.fare}</Text>
                    </View>
                    <Text style={styles.cardBody}>Driver: {t.driverName}</Text>
                    <Text style={styles.cardBody}>Capacity: {t.capacity} seats</Text>
                    <Text style={styles.cardBody}>Status: {t.isAvailable ? 'Waiting at Rank' : 'On Route'}</Text>
                  </View>
                ))}
                {taxisList.filter(t => t.rankName === selectedRank).length === 0 && (
                  <Text style={styles.emptyText}>No registered taxis found for this rank.</Text>
                )}
              </View>
            )}

            {user.role === 'passenger' && tab === 'news' && (
              <View>
                <Text style={styles.sectionTitle}>Announcements</Text>
                {newsList.map((item, i) => (
                  <View key={i} style={[styles.card, item.priority === 'high' && { borderColor: '#dc3545', borderWidth: 1 }]}>
                    <Text style={styles.cardHeader}>{item.title}</Text>
                    <Text style={styles.cardBody}>{item.content}</Text>
                    <Text style={styles.cardDate}>{item.createdAt}</Text>
                  </View>
                ))}
              </View>
            )}

            {user.role === 'passenger' && tab === 'reviews' && (
              <View>
                <Text style={styles.sectionTitle}>Leave Feedback</Text>
                <View style={styles.card}>
                  <Text style={styles.label}>Select Rank</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedRank}
                    editable={false}
                  />

                  <Text style={[styles.label, { marginTop: 12 }]}>Your Review</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Enter review comments..."
                    placeholderTextColor="#64748b"
                    multiline
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitReview}>
                    <Text style={styles.primaryButtonText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Reviews</Text>
                {reviewsList.map((rev, i) => (
                  <View key={i} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.reviewUser}>{rev.userName}</Text>
                      <Text style={styles.ratingText}>{"★".repeat(rev.rating)}</Text>
                    </View>
                    <Text style={styles.reviewRank}>{rev.rankName}</Text>
                    <Text style={styles.cardBody}>{rev.comment}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── OWNER INTERFACE ── */}
            {user.role === 'owner' && (
              <View>
                <Text style={styles.sectionTitle}>Register Taxi</Text>
                <View style={styles.card}>
                  <Text style={styles.label}>Registration Number</Text>
                  <TextInput
                    style={styles.input}
                    value={regNumber}
                    onChangeText={setRegNumber}
                    placeholder="e.g. THA 105 GP"
                    placeholderTextColor="#64748b"
                  />

                  <Text style={[styles.label, { marginTop: 12 }]}>Driver Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={driverName}
                    onChangeText={setDriverName}
                    placeholder="Driver Name"
                    placeholderTextColor="#64748b"
                  />

                  <Text style={[styles.label, { marginTop: 12 }]}>Driver Cellphone</Text>
                  <TextInput
                    style={styles.input}
                    value={driverCell}
                    onChangeText={setDriverCell}
                    placeholder="Driver Cell"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                  />

                  <TouchableOpacity style={styles.primaryButton} onPress={handleAddTaxi}>
                    <Text style={styles.primaryButtonText}>Register Vehicle</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Fleet ({taxisList.filter(t => t.ownerName === user.fullName).length})</Text>
                {taxisList.filter(t => t.ownerName === user.fullName).map((t, i) => (
                  <View key={i} style={styles.card}>
                    <Text style={styles.cardHeader}>{t.registrationNumber}</Text>
                    <Text style={styles.cardBody}>Driver: {t.driverName} ({t.driverCell})</Text>
                    <Text style={styles.cardBody}>Route: {t.rankName}</Text>
                    <Text style={styles.cardBody}>Trips completed: {t.totalRides}</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => handleJoinQueue(t.taxiId)}>
                      <Text style={styles.secondaryButtonText}>Simulate Join Queue</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── MARSHAL INTERFACE ── */}
            {user.role === 'marshal' && (
              <View>
                <Text style={styles.sectionTitle}>{user.rankName} Dispatch Queue</Text>
                {queuesList.filter(q => q.rankName === user.rankName).map((item, i) => (
                  <View key={i} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.cardHeader}>Pos {item.queuePosition}: {item.driverName}</Text>
                      <TouchableOpacity style={styles.dispatchButton} onPress={() => handleDispatch(item.queueId)}>
                        <Text style={styles.dispatchButtonText}>Dispatch</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cardBody}>Status: {item.status.toUpperCase()}</Text>
                    <Text style={styles.cardBody}>Joined: {new Date(item.joinedAt).toLocaleTimeString()}</Text>
                  </View>
                ))}
                {queuesList.filter(q => q.rankName === user.rankName).length === 0 && (
                  <Text style={styles.emptyText}>Queue is currently empty.</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© PMP Solutions 2024 • E-RANK System</Text>
        <Text style={styles.footerWarning}>Do NOT modify or duplicate this system</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#0b0f19', // Deep dark background
  },
  header: {
    height: 60,
    backgroundColor: '#1e3a5f', // E-Rank Navy
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  logoutText: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#1e3a5f',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testAccountsCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  testAccountTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testAccountText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 20,
  },
  codeText: {
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  dashboardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  badgeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  badgeButtonActive: {
    backgroundColor: '#1e3a5f',
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: '#ffffff',
  },
  fareText: {
    color: '#28a745',
    fontWeight: 'bold',
    fontSize: 18,
  },
  reviewUser: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  reviewRank: {
    fontSize: 12,
    color: '#64748b',
    marginVertical: 4,
  },
  ratingText: {
    color: '#ffc107',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dispatchButton: {
    backgroundColor: '#28a745',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dispatchButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#1e3a5f', // Matching user's favorite footer color
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 4,
    borderTopColor: '#28a745', // Green top accent from original poster
  },
  footerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerWarning: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrHeaderTitle: {
    color: '#1e3a5f',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  qrHeaderSubtitle: {
    color: '#475569',
    fontSize: 11,
  },
  simulatedQRCode: {
    width: 160,
    height: 160,
    borderWidth: 2,
    borderColor: '#1e3a5f',
    backgroundColor: '#f8fafc',
    padding: 12,
    justifyContent: 'center',
  },
  qrFinderPattern: {
    width: 32,
    height: 32,
    borderWidth: 8,
    borderColor: '#1e3a5f',
    position: 'absolute',
    left: 12,
    top: 12,
  },
  qrFooter: {
    alignItems: 'center',
    marginTop: 12,
  },
  qrFooterTitle: {
    color: '#1e3a5f',
    fontSize: 11,
    fontWeight: 'bold',
  },
  qrFooterWarning: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  }
});
