import 'package:flutter/material.dart';
/// Driver shell — MOBILE ONLY (QR scan uses device camera; GPS used for radius check).
/// Provides: QR scan to join queue, fare entry + departure button.
/// TODO: implement using mobile_scanner + MapsService.isWithinRadius.
class DriverShell extends StatelessWidget {
  const DriverShell({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver')),
      body: const Center(child: Text('TODO: Driver Dashboard')),
    );
  }
}
