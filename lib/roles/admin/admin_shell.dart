import 'package:flutter/material.dart';

/// Admin shell — desktop + mobile.
/// Provides: overview dashboard, per-owner drill-down, add/import owners,
/// analytics adjacent to alerts, and revenue exports.
///
/// Desktop build is supported here because the admin never needs QR scanning or GPS.
///
/// TODO:
///   - Build navigation rail (desktop) / bottom nav (mobile)
///   - Wire up FirestoreService streams for stats
///   - Implement owner drill-down page
///   - Implement Excel import UI (ExcelImportService)
///   - Implement revenue export (CSV/Excel download)
class AdminShell extends StatelessWidget {
  const AdminShell({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: const Center(child: Text('TODO: Admin Dashboard')),
    );
  }
}
