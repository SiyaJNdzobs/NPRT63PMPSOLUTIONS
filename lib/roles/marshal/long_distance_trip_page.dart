/// Marshal — long-distance trip form.
/// Captures: destination rank, driver, taxi, passenger count, fare, next-of-kin email.
/// On submit: writes to 'trips' collection and triggers next-of-kin email via EmailService.
/// TODO: implement form + EmailService.sendNextOfKinNotification.
import 'package:flutter/material.dart';
class LongDistanceTripPage extends StatelessWidget {
  const LongDistanceTripPage({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('TODO: Long-Distance Trip Form'));
}
