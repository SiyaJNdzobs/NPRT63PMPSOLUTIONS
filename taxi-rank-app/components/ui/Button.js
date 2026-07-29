/**
 * components/ui/Button.js — E-RANK shared button component
 * Enforces min 44×44 tap target per spec.
 *
 * Variants:
 *   primary   — accent colour fill (one per screen max)
 *   secondary — bordered, no fill
 *   ghost     — text only
 *   danger    — error colour fill (destructive actions)
 *   success   — success colour fill
 */
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors, Typography, Spacing, Radius, MIN_TAP_TARGET } from '../../lib/theme';

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon = null,
  style,
}) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? Colors.accent : Colors.bgBase}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TAP_TARGET,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { marginRight: 4 },

  // Sizes
  size_sm: { minHeight: MIN_TAP_TARGET, paddingHorizontal: Spacing.md },
  size_md: { minHeight: MIN_TAP_TARGET + 4 },
  size_lg: { minHeight: 56, borderRadius: Radius.lg },

  // Variants — container
  variant_primary:   { backgroundColor: Colors.accent },
  variant_secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.accent },
  variant_ghost:     { backgroundColor: 'transparent' },
  variant_danger:    { backgroundColor: Colors.error },
  variant_success:   { backgroundColor: Colors.success },

  // Variants — label color
  label: { fontWeight: Typography.weight.semibold, textAlign: 'center' },
  label_primary:   { color: Colors.bgBase },
  label_secondary: { color: Colors.accent },
  label_ghost:     { color: Colors.textSecondary },
  label_danger:    { color: Colors.textPrimary },
  label_success:   { color: Colors.bgBase },

  // Label sizes
  labelSize_sm: { fontSize: Typography.size.sm },
  labelSize_md: { fontSize: Typography.size.md },
  labelSize_lg: { fontSize: Typography.size.lg },
});
