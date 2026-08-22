import 'package:flutter/material.dart';
import '../roles/admin/admin_shell.dart';
import '../roles/owner/owner_shell.dart';
import '../roles/marshal/marshal_shell.dart';
import '../roles/driver/driver_shell.dart';
import '../roles/passenger/passenger_shell.dart';
import 'auth_service.dart';
import 'login_screen.dart';

/// AuthGate decides which shell to show based on the currently signed-in role.
/// It listens to [AuthService.authStateStream] (a local stream backed by
/// SharedPreferences/secure storage — NOT FirebaseAuth).
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthUser?>(
      stream: AuthService.instance.authStateStream,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final user = snapshot.data;
        if (user == null) return const LoginScreen();

        // Route to the correct role shell
        switch (user.role) {
          case 'admin':    return const AdminShell();
          case 'owner':    return const OwnerShell();
          case 'marshal':  return const MarshalShell();
          case 'driver':   return const DriverShell();
          default:         return const PassengerShell();
        }
      },
    );
  }
}
