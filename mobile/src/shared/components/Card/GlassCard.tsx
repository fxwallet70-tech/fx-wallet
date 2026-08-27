import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Theme from '../../../core/theme/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Clean card surface — no backdrop blur.
 * The outer `style` keeps the card's border radius, padding and shadow;
 * children flow directly inside the container so row/flex layouts
 * (transactions, stat rows) keep working untouched.
 */
const GlassCard = ({children, style}: Props) => {
  return (
    <View style={[styles.cardSurface, style]}>{children}</View>
  );
};

export default GlassCard;

const styles = StyleSheet.create({
  cardSurface: {
    backgroundColor: Theme.colors.glass,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },
});
