import 'package:flutter/material.dart';
/// Owner shell — MOBILE ONLY (driver management requires phone GPS/QR).
/// Provides: add taxi, add/reassign/suspend driver, revenue table.
/// TODO: implement bottom nav, wire FirestoreService streams.
class OwnerShell extends StatelessWidget {
  const OwnerShell({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Owner Dashboard')),
      body: const Center(child: Text('TODO: Owner Dashboard')),
    );
  }
}
