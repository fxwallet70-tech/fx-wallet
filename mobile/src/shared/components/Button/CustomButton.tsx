import React, {useRef} from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import Theme from '../../../core/theme/theme';

interface Props {
  title: string;
  onPress: () => void;
}

const CustomButton = ({title, onPress}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      friction: 7,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}>
      <Animated.View
    style={[styles.button, {transform: [{scale}]}]}>
    <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: Theme.colors.primary,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    // Neutral depth shadow only (glow removed)
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    boxShadow: '0px 6px 18px rgba(0,0,0,0.35)',
    elevation: 4,
  },

  text: {
    color: Theme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});