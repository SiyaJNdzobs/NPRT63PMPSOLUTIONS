/// Firestore document model for the 'owners' collection.
/// TODO: add fromJson/toJson, copyWith.
class OwnerModel {
  final String ownerId;
  final String displayName;
  final String cellNumber;
  final String email;
  final String rankId;
  final int    totalTaxis;
  final double totalRevenue;

  const OwnerModel({
    required this.ownerId,
    required this.displayName,
    required this.cellNumber,
    required this.email,
    required this.rankId,
    this.totalTaxis   = 0,
    this.totalRevenue = 0,
  });
}
