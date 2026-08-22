/// Firestore document model for the 'marshals' collection.
/// TODO: add fromJson/toJson, copyWith.
class MarshalModel {
  final String marshalId;
  final String displayName;
  final String cellNumber;
  final String rankId;
  final bool   isActive;

  const MarshalModel({
    required this.marshalId,
    required this.displayName,
    required this.cellNumber,
    required this.rankId,
    this.isActive = true,
  });
}
