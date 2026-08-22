import 'package:flutter/material.dart';
/// Passenger shell — no sign-in required.
/// Public landing: fare/route search, rank lookup, news feed.
/// TODO: implement tabs for search, rank map, and news.
class PassengerShell extends StatelessWidget {
  const PassengerShell({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Find a Taxi')),
      body: const Center(child: Text('TODO: Passenger Landing')),
    );
  }
}
