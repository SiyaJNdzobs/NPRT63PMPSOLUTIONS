import 'package:flutter/material.dart';

/// Login screen: accepts cell number OR email + 6-digit PIN.
///
/// TODO:
///   - Implement login form UI (cell number / email and 6-digit PIN fields)
///   - Implement form validation and loading/error states
///   - Wire up AuthService.instance.signIn
///   - Add navigation to OTP reset flow (OtpResetScreen)
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign In')),
      body: const Center(
        child: Text('TODO: Login Screen'),
      ),
    );
  }
}
