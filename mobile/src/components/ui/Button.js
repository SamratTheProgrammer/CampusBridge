import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, Spacing } from '../../theme/colors';

export default function Button({
  title,
  onPress,
  variant = 'primary',   // 'primary' | 'outline' | 'ghost' | 'danger'
  size = 'md',           // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = true,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: BorderRadius.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: BorderRadius.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: BorderRadius.lg },
  };

  const textSizes = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.lg };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={isDisabled ? ['#374151', '#374151'] : Colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientBtn, sizeStyles[size]]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.btnContent}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[styles.primaryText, { fontSize: textSizes[size] }, textStyle]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.outlineBtn,
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <View style={styles.btnContent}>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.outlineText, { fontSize: textSizes[size] }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.ghostBtn,
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        <View style={styles.btnContent}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.ghostText, { fontSize: textSizes[size] }, textStyle]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientBtn, sizeStyles[size]]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.btnContent}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[styles.primaryText, { fontSize: textSizes[size] }, textStyle]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  gradientBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ghostBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconLeft: { marginRight: 4 },
  primaryText: { color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  outlineText: { color: Colors.primary, fontWeight: '600', letterSpacing: 0.3 },
  ghostText: { color: Colors.textSecondary, fontWeight: '500' },
  disabled: { opacity: 0.5 },
});
