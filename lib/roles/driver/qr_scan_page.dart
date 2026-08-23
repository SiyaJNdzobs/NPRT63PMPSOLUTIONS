/// Driver — QR scan screen.
/// Uses mobile_scanner to decode the rank QR code.
/// Validates GPS position is within rank radius (MapsService.isWithinRadius).
/// On success: calls FirestoreService.joinQueue.
/// MOBILE ONLY — do not import this on desktop builds.
/// TODO: implement scanner + GPS validation + queue join.
import 'package:flutter/material.dart';
class QrScanPage extends StatelessWidget {
  const QrScanPage({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('TODO: QR Scan (mobile only)'));
}
