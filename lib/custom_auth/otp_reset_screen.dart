import 'package:flutter/material.dart';

/// OTP-based PIN reset flow (3 steps: enter email → enter OTP → set new PIN).
/// TODO: implement each step using AuthService.requestOtpReset and verifyOtpAndSetPin.
class OtpResetScreen extends StatelessWidget {
  const OtpResetScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset PIN')),
      body: const Center(child: Text('TODO: OTP reset flow')),
    );
  }
}
