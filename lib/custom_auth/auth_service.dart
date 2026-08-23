/// Custom auth service: cell/email + 6-digit PIN, validated via Cloud Function.
/// No FirebaseAuth email/password flow is used.
///
/// TODO:
///   - Implement signIn(identifier, pin) — calls the 'validatePin' Cloud Function
///   - Implement requestOtpReset(email) — calls the 'sendOtpEmail' Cloud Function
///   - Implement verifyOtp(email, otp) + setNewPin(pin)
///   - Persist session to FlutterSecureStorage / SharedPreferences
///   - Expose authStateStream so AuthGate can rebuild on sign-in/out
import 'dart:async';

class AuthUser {
  final String uid;
  final String role;
  final String displayName;
  const AuthUser({required this.uid, required this.role, required this.displayName});
}

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final StreamController<AuthUser?> _controller =
      StreamController<AuthUser?>.broadcast();

  Stream<AuthUser?> get authStateStream => _controller.stream;

  // TODO: replace stub with real implementation
  Future<void> signIn(String identifier, String pin) async {
    throw UnimplementedError('signIn not yet implemented');
  }

  Future<void> signOut() async {
    _controller.add(null);
  }

  Future<void> requestOtpReset(String email) async {
    throw UnimplementedError('requestOtpReset not yet implemented');
  }

  Future<void> verifyOtpAndSetPin(String email, String otp, String newPin) async {
    throw UnimplementedError('verifyOtpAndSetPin not yet implemented');
  }
}
