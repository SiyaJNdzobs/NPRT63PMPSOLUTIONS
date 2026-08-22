import 'package:flutter/material.dart';
/// Marshal shell — MOBILE ONLY (QR generation/download, live queue management).
/// Provides: queue view, QR generate/download, long-distance trip form,
/// news/alert posting, rank operating-hours display.
/// TODO: implement bottom nav, wire FirestoreService streams.
class MarshalShell extends StatelessWidget {
  const MarshalShell({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Marshal Dashboard')),
      body: const Center(child: Text('TODO: Marshal Dashboard')),
    );
  }
}
