import 'package:cloud_firestore/cloud_firestore.dart';
import '../core/constants.dart';

/// Central Firestore access layer.
/// Offline persistence is enabled in main.dart via Settings(persistenceEnabled: true).
///
/// TODO for each method group:
///   - Implement CRUD for users, owners, taxis, drivers, marshals, ranks
///   - Implement queue join / dispatch / leave
///   - Implement trip/revenue writes and aggregation queries
///   - Add real-time snapshot streams for queue and alerts
class FirestoreService {
  FirestoreService._();
  static final FirestoreService instance = FirestoreService._();

  final _db = FirebaseFirestore.instance;

  // ── Users ──────────────────────────────────────────────────────────────────
  // TODO: getUserById, getUserByCell, getUserByEmail, updateUser

  // ── Owners ─────────────────────────────────────────────────────────────────
  // TODO: getOwners, getOwnerById, addOwner, updateOwner

  // ── Taxis ──────────────────────────────────────────────────────────────────
  // TODO: getTaxisByOwner, getTaxisByRank, addTaxi, updateTaxi

  // ── Drivers ────────────────────────────────────────────────────────────────
  // TODO: getDriversByOwner, addDriver, suspendDriver, reassignDriver

  // ── Queue ──────────────────────────────────────────────────────────────────
  // TODO: joinQueue(taxiId, rankId), leaveQueue, dispatchNext, streamQueue(rankId)

  // ── Trips / Revenue ────────────────────────────────────────────────────────
  // TODO: recordTrip, streamRevenueByOwner, exportRevenueCsv

  // ── Ranks ──────────────────────────────────────────────────────────────────
  // TODO: getRanks, getRankById, addRank, updateRank

  // ── Alerts ─────────────────────────────────────────────────────────────────
  // TODO: postAlert, streamAlerts(rankId), markAlertRead
}
