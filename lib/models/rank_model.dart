/// Firestore document model for the 'ranks' collection.
/// TODO: add fromJson/toJson, copyWith.
class RankModel {
  final String rankId;
  final String rankName;
  final String city;
  final String province;
  final double latitude;
  final double longitude;
  final double qrRadiusMeters;    // GPS radius within which QR scan is valid
  final String openTime;          // e.g. '06:00'
  final String closeTime;         // e.g. '20:00'
  final bool   isActive;

  const RankModel({
    required this.rankId,
    required this.rankName,
    required this.city,
    required this.province,
    required this.latitude,
    required this.longitude,
    this.qrRadiusMeters = 200,
    required this.openTime,
    required this.closeTime,
    this.isActive = true,
  });
}
