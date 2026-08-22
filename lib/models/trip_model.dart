/// Firestore document model for the 'trips' collection (revenue + long-distance).
/// TODO: add fromJson/toJson, copyWith.
class TripModel {
  final String  tripId;
  final String  taxiId;
  final String  driverId;
  final String  rankId;
  final double  fare;
  final int     passengerCount;
  final bool    isLongDistance;
  final String? destinationRankId;
  final String? nextOfKinEmail;   // for long-distance trips
  final DateTime departedAt;

  const TripModel({
    required this.tripId,
    required this.taxiId,
    required this.driverId,
    required this.rankId,
    required this.fare,
    required this.passengerCount,
    required this.departedAt,
    this.isLongDistance      = false,
    this.destinationRankId,
    this.nextOfKinEmail,
  });
}
