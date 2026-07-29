/**
 * components/ui/Input.js — E-RANK shared input field
 *
 * Features:
 *   - Live cell number validation (inline checkmark/error)
 *   - PIN mode: numeric keypad, masked, fixed length, auto-submits
 *   - Error state display
 *   - Label + helper text
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, MIN_TAP_TARGET } from '../../lib/theme';
import { CELL_REGEX } from '../../lib/constants';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'none',
  autoCorrect = false,
  error,
  helperText,
  validateCell = false,   // enable live SA cell number validation
  isPIN = false,          // 6-digit numeric PIN mode
  onPINComplete,          // called when 6 digits entered (auto-submit)
  editable = true,
  style,
  inputRef,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  // Live cell validation state
  const cellValid   = validateCell && value.length === 10 && CELL_REGEX.test(value);
  const cellInvalid = validateCell && touched && value.length > 0 && !CELL_REGEX.test(value);

  const handleChangeText = (text) => {
    onChangeText(text);
    if (isPIN && text.length === 6) {
      onPINComplete?.(text);
    }
  };

  const resolvedKeyboard = isPIN ? 'number-pad' : keyboardType;
  const resolvedSecure   = isPIN ? true : (secureTextEntry && !showPassword);
  const resolvedMax      = isPIN ? 6 : maxLength;

  const borderColor = error || cellInvalid
    ? Colors.error
    : cellValid
    ? Colors.success
    : Colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputRow, { borderColor }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDisabled}
          secureTextEntry={resolvedSecure}
          keyboardType={resolvedKeyboard}
          maxLength={resolvedMax}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          selectionColor={Colors.accent}
        />

        {/* Cell validation indicator */}
        {validateCell && touched && value.length > 0 && (
          <Feather
            name={cellValid ? 'check-circle' : 'alert-circle'}
            size={18}
            color={cellValid ? Colors.success : Colors.error}
            style={styles.inlineIcon}
          />
        )}

        {/* Show/hide password toggle */}
        {secureTextEntry && !isPIN && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error or helper text */}
      {(error || cellInvalid || helperText) && (
        <Text style={[styles.helper, (error || cellInvalid) && styles.helperError]}>
          {error || (cellInvalid ? 'Enter a valid SA cell number (e.g. 0821234567)' : helperText)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    minHeight: MIN_TAP_TARGET + 4,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.regular,
    paddingVertical: Spacing.xs,
  },
  inlineIcon: { marginLeft: Spacing.xs },
  eyeBtn: {
    minWidth: MIN_TAP_TARGET,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helper: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  helperError: { color: Colors.error },
});
