/// Email dispatch (OTP + next-of-kin long-distance notifications).
/// Using Firebase's official 'Trigger Email' extension (writes to 'mail' collection
/// in Firestore; the extension picks it up and sends via SendGrid/SMTP).
///
/// Alternatively, call a Cloud Function that uses the SendGrid Node SDK directly —
/// adjust if the team changes provider.
///
/// TODO:
///   - sendOtpEmail(to, otp)
///   - sendNextOfKinNotification(to, driverName, route, departureTime)
///   - sendRevenueExport(to, attachmentUrl)
class EmailService {
  EmailService._();
  static final EmailService instance = EmailService._();

  // TODO: implement via Firestore 'mail' collection write (Trigger Email extension)
}
