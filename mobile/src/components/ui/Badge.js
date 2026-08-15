import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../../theme/colors';

const variantStyles = {
  primary: { bg: 'rgba(99,102,241,0.2)', text: Colors.primaryLight, border: 'rgba(99,102,241,0.4)' },
  success: { bg: Colors.successBg, text: Colors.success, border: 'rgba(34,197,94,0.3)' },
  warning: { bg: Colors.warningBg, text: Colors.warning, border: 'rgba(245,158,11,0.3)' },
  error: { bg: Colors.errorBg, text: Colors.error, border: 'rgba(239,68,68,0.3)' },
  info: { bg: Colors.infoBg, text: Colors.info, border: 'rgba(59,130,246,0.3)' },
  muted: { bg: 'rgba(100,116,139,0.15)', text: Colors.textMuted, border: 'rgba(100,116,139,0.2)' },
  purple: { bg: 'rgba(168,85,247,0.15)', text: Colors.secondary, border: 'rgba(168,85,247,0.3)' },
};

export default function Badge({ label, variant = 'primary', size = 'sm', icon = null, style }) {
  const v = variantStyles[variant] || variantStyles.primary;
  const fontSize = size === 'sm' ? FontSize.xs : FontSize.sm;
  const padding = size === 'sm' ? { paddingVertical: 3, paddingHorizontal: 8 } : { paddingVertical: 5, paddingHorizontal: 12 };

  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }, padding, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, { color: v.text, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { marginRight: 4 },
  text: { fontWeight: '600', letterSpacing: 0.2 },
});
