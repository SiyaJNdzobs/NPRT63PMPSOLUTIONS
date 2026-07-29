/**
 * components/ui/Card.js — E-RANK surface card
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../lib/theme';

export default function Card({ children, elevated = false, style, ...props }) {
  return (
    <View
      style={[styles.card, elevated && styles.elevated, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  elevated: {
    backgroundColor: Colors.bgElevated,
    ...Shadow.md,
  },
});
