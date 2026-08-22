/// Firestore document model for the 'alerts' collection (marshal news/alerts).
/// Also used to trigger FCM push notifications.
/// TODO: add fromJson/toJson, copyWith.
class AlertModel {
  final String   alertId;
  final String   marshalId;
  final String   rankId;
  final String   title;
  final String   body;
  final String   type;         // e.g. 'news' | 'incident' | 'route_change'
  final DateTime postedAt;
  final bool     pushSent;

  const AlertModel({
    required this.alertId,
    required this.marshalId,
    required this.rankId,
    required this.title,
    required this.body,
    required this.type,
    required this.postedAt,
    this.pushSent = false,
  });
}
