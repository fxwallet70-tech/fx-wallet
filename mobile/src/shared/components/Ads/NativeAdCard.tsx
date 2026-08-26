import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import Theme from '../../../core/theme/theme';
import GlassCard from '../Card/GlassCard';
import StartIoNativeAdView from './StartIoNativeAdView';

interface Props {
  /** Fired after the ad card is rendered, so parents can report/analytics. */
  onShown?: () => void;
}

/**
 * Native ad card rendered by the Start.io native view.
 * The native side builds the ad layout and registers it for
 * click/impression tracking, matching the app's glass style.
 */
const NativeAdCard = ({onShown}: Props) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Sponsored</Text>
      </View>

      <StartIoNativeAdView style={styles.adView} onShown={onShown} />
    </GlassCard>
  );
};

export default NativeAdCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.glass,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(166,54,6,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },

  badgeText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  adView: {
    width: '100%',
    minHeight: 120,
  },
});
