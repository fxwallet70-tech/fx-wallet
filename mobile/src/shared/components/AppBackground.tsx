import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import Theme from '../../core/theme/theme';

const AppBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (
      value: Animated.Value,
      distance: number,
      duration: number,
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: -distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const a1 = float(orb1Y, 18, 3200);
    const a2 = float(orb2Y, 26, 4300);
    const a3 = float(orb3Y, 14, 3600);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [orb1Y, orb2Y, orb3Y]);

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <Animated.View
        style={[styles.orb, styles.orb1, {transform: [{translateY: orb1Y}]}]}
      />
      <Animated.View
        style={[styles.orb, styles.orb2, {transform: [{translateY: orb2Y}]}]}
      />
      <Animated.View
        style={[styles.orb, styles.orb3, {transform: [{translateY: orb3Y}]}]}
      />
      <View style={styles.orb4} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default AppBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
  },

  glowTop: {
    position: 'absolute',
    top: -140,
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(37,99,235,0.30)',
  },

  orb: {
    position: 'absolute',
    borderRadius: 999,
  },

  orb1: {
    top: 110,
    left: -70,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(59,130,246,0.20)',
  },

  orb2: {
    top: 300,
    right: -80,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(96,165,250,0.18)',
  },

  orb3: {
    bottom: 180,
    left: -50,
    width: 210,
    height: 210,
    backgroundColor: 'rgba(37,99,235,0.22)',
  },

  orb4: {
    position: 'absolute',
    bottom: -90,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59,130,246,0.25)',
  },

  content: {
    flex: 1,
  },
});
