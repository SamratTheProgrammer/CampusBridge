import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Shadow } from '../../theme/colors';

export default function Card({ children, style, elevated = false, gradient = false }) {
  return (
    <View
      style={[
        styles.card,
        elevated && Shadow.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 16,
    overflow: 'hidden',
  },
});
