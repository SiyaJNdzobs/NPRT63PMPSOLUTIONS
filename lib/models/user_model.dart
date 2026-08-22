/// Firestore document model for the 'users' collection.
/// TODO: add fromJson/toJson, copyWith.
class UserModel {
  final String uid;
  final String role;           // admin | owner | marshal | driver | passenger
  final String displayName;
  final String cellNumber;
  final String email;
  final String pinHash;        // bcrypt hash stored server-side via Cloud Function
  final bool   isActive;

  const UserModel({
    required this.uid,
    required this.role,
    required this.displayName,
    required this.cellNumber,
    required this.email,
    required this.pinHash,
    this.isActive = true,
  });
}
