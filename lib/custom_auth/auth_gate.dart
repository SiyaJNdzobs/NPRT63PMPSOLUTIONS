import 'package:flutter/material.dart';
import 'login_screen.dart';

/// AuthGate decides which shell to show based on the currently signed-in role.
///
/// TODO:
///   - Listen to AuthService.instance.authStateStream
///   - Handle loading / waiting connection state
///   - Route to the appropriate role shell based on user.role:
///       - 'admin'    -> AdminShell
///       - 'owner'    -> OwnerShell
///       - 'marshal'  -> MarshalShell
///       - 'driver'   -> DriverShell
///       - unauthenticated / default -> LoginScreen or PassengerShell
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return const LoginScreen();
  }
}
