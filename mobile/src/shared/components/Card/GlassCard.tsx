import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {BlurView} from '@react-native-community/blur';

import Theme from '../../../core/theme/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Higher = stronger frosted blur. */
  blurAmount?: number;
}

/**
 * Frosted-glass card: real backdrop blur behind a translucent warm surface.
 * The outer `style` keeps the card's border radius, padding and shadow,
 * while the blur layer is clipped to the card's rounded corners.
 * Children flow directly in the outer container, so row/flex layouts
 * (transactions, stat rows) keep working untouched.
 */
const GlassCard = ({children, style, blurAmount = 20}: Props) => {
  const flat = (StyleSheet.flatten(style) || {}) as ViewStyle;

  const clipRadius = {
    borderTopLeftRadius:
      flat.borderTopLeftRadius ?? flat.borderRadius ?? 0,
    borderTopRightRadius:
      flat.borderTopRightRadius ?? flat.borderRadius ?? 0,
    borderBottomLeftRadius:
      flat.borderBottomLeftRadius ?? flat.borderRadius ?? 0,
    borderBottomRightRadius:
      flat.borderBottomRightRadius ?? flat.borderRadius ?? 0,
  };

  return (
    <View style={[styles.glassSurface, style]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.blurClip,
          clipRadius,
        ]}>
        <BlurView
          blurType="light"
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor={Theme.colors.glass}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
    </View>
  );
};

export default GlassCard;

const styles = StyleSheet.create({
  blurClip: {
    overflow: 'hidden',
    // Keep this layer light so the animated background orbs show
    // through the frosted blur — this is what reads as "glassy".
    backgroundColor: 'rgba(15,25,50,0.22)',
  },

  glassSurface: {
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },
});
