import 'package:flutter/material.dart';

/// App-wide colour palette and ThemeData.
/// TODO: finalise brand colours and typography.
class AppTheme {
  static const Color primary    = Color(0xFF1E3A5F); // Navy
  static const Color accent     = Color(0xFF28A745); // Green
  static const Color background = Color(0xFF0B0F19); // Deep dark slate
  static const Color surface    = Color(0xFF0F172A);
  static const Color error      = Color(0xFFDC3545);

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorSchemeSeed: primary,
    brightness: Brightness.light,
  );

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    colorSchemeSeed: primary,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    cardColor: surface,
  );
}
