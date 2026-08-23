/// App-wide string constants (route names, Firestore collection keys, etc.)
/// TODO: populate as routes and collections are defined.
class AppConstants {
  // Firestore collections
  static const String usersCol    = 'users';
  static const String ownersCol   = 'owners';
  static const String taxisCol    = 'taxis';
  static const String driversCol  = 'drivers';
  static const String marshalsCol = 'marshals';
  static const String ranksCol    = 'ranks';
  static const String queuesCol   = 'queues';
  static const String tripsCol    = 'trips';
  static const String alertsCol   = 'alerts';

  // User roles
  static const String roleAdmin     = 'admin';
  static const String roleOwner     = 'owner';
  static const String roleMarshal   = 'marshal';
  static const String roleDriver    = 'driver';
  static const String rolePassenger = 'passenger';
}
