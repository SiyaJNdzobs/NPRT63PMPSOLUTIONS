/// Firestore document model for the 'taxis' collection.
/// TODO: add fromJson/toJson, copyWith.
class TaxiModel {
  final String taxiId;
  final String registrationNumber;
  final String ownerId;
  final String driverId;
  final String rankId;
  final int    capacity;
  final double fare;
  final bool   isActive;

  const TaxiModel({
    required this.taxiId,
    required this.registrationNumber,
    required this.ownerId,
    required this.driverId,
    required this.rankId,
    required this.capacity,
    required this.fare,
    this.isActive = true,
  });
}
