import 'package:cloud_functions/cloud_functions.dart';

/// Wrapper for Firebase Cloud Functions calls.
///
/// TODO:
///   - validatePin(identifier, pin) → returns {uid, role} or throws
///   - sendOtpEmail(email) → triggers SendGrid OTP email via Cloud Function
///   - verifyOtp(email, otp) → returns bool
///   - hashAndStorePin(uid, newPin) → stores bcrypt hash in Firestore
///   - processExcelImport(storageRef) → parses uploaded Excel, bulk-writes owners/taxis
///   - aggregateRevenue(ownerId, period) → returns summary object
class FunctionsService {
  FunctionsService._();
  static final FunctionsService instance = FunctionsService._();

  final _functions = FirebaseFunctions.instance;

  // TODO: implement each callable function wrapper
}
