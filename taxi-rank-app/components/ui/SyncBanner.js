/**
 * components/ui/SyncBanner.js
 * Non-intrusive banner showing offline/syncing/synced state.
 * Visible, non-silent — users trust the app even during load-shedding.
 */
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../lib/theme';

const CONFIG = {
  offline:  { icon: 'wifi-off',         color: Colors.error,   bg: '#2A1A19', label: 'Offline — changes saved locally' },
  syncing:  { icon: 'refresh-cw',        color: Colors.accent,  bg: '#26200E', label: 'Syncing to server…' },
  synced:   { icon: 'check-circle',      color: Colors.success, bg: '#142219', label: 'All changes synced' },
  error:    { icon: 'alert-triangle',    color: Colors.warning, bg: '#26200E', label: 'Sync error — will retry' },
  idle:     null,
};

export default function SyncBanner({ status }) {
  const cfg = CONFIG[status];
  if (!cfg) return null;

  return (
    <View style={[styles.banner, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
      <Feather name={cfg.icon} size={14} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs + 2,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
});
