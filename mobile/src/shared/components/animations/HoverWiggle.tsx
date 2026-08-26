import React, {useRef} from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Max tilt angle in degrees. */
  wiggleDeg?: number;
  /** How much the card lifts on hover. */
  lift?: number;
  /** How much the card scales up on hover. */
  scaleTo?: number;
}

/**
 * Fun card motion wrapper: when the pointer hovers the card (mouse) or the
 * user presses it (touch), the card does a quick playful wiggle and settles
 * into a gentle lifted state; releasing springs it back to rest.
 */
const HoverWiggle = ({
  children,
  style,
  wiggleDeg = 2.5,
  lift = 3,
  scaleTo = 1.02,
}: Props) => {
  const hover = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  const playWiggle = () => {
    Animated.sequence([
      Animated.timing(wobble, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(wobble, {
        toValue: -1,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(wobble, {
        toValue: 0.6,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(wobble, {
        toValue: -0.35,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(wobble, {
        toValue: 0,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateActive = (active: boolean, withWiggle = false) => {
    Animated.spring(hover, {
      toValue: active ? 1 : 0,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();

    if (active && withWiggle) {
      playWiggle();
    } else if (!active) {
      wobble.stopAnimation();
      wobble.setValue(0);
    }
  };

  const handleHoverIn = () => animateActive(true, true);
  const handleHoverOut = () => animateActive(false);
  const handlePressIn = (_event: GestureResponderEvent) => {
    // Touch/press only lifts the card gently — the playful wiggle is
    // reserved for mouse hover so scrolling the list stays calm.
    animateActive(true);
  };
  const handlePressOut = () => animateActive(false);

  const rotate = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [`-${wiggleDeg}deg`, '0deg', `${wiggleDeg}deg`],
  });

  const translateY = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -lift],
  });

  const scale = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [1, scaleTo],
  });

  return (
    <Pressable
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}>
      <Animated.View
        style={{
          transform: [{rotate}, {scale}, {translateY}],
        }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default HoverWiggle;
