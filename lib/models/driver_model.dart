/// Firestore document model for the 'drivers' collection.
/// TODO: add fromJson/toJson, copyWith.
class DriverModel {
  final String driverId;
  final String displayName;
  final String cellNumber;
  final String taxiId;
  final String rankId;
  final String ownerId;
  final bool   isActive;

  const DriverModel({
    required this.driverId,
    required this.displayName,
    required this.cellNumber,
    required this.taxiId,
    required this.rankId,
    required this.ownerId,
    this.isActive = true,
  });
}
