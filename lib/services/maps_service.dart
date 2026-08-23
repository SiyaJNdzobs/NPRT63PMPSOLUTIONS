import 'package:geolocator/geolocator.dart';
// import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Google Maps and GPS utilities.
///
/// TODO:
///   - requestLocationPermission()
///   - getCurrentPosition() → Position
///   - isWithinRadius(Position current, double targetLat, double targetLng, double radiusMeters) → bool
///     (used to validate QR scan is inside the rank boundary)
///   - streamDriverLocation(driverId) — writes GPS updates to Firestore for live tracking
class MapsService {
  MapsService._();
  static final MapsService instance = MapsService._();

  // TODO: implement
}
