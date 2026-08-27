import React, {useEffect, useRef} from 'react';
import {StyleSheet, View, Animated, ImageBackground} from 'react-native';

const AppBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <ImageBackground
      source={require('../../assets/images/appbackground.png')}
      style={styles.container}
      imageStyle={styles.image}
      resizeMode="cover">
      <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
        {children}
      </Animated.View>
    </ImageBackground>
  );
};

export default AppBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
});
