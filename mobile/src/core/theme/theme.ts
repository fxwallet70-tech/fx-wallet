import Colors from './colors';

const Theme = {
  colors: Colors,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },  radius: {
    sm: 8,
    md: 14,
    lg: 20,
  },

  shadows: {
    card: {
      shadowColor: Colors.glassShadow,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      // Cross-platform colored glow (works on Android + iOS via boxShadow)
      boxShadow: '0px 6px 20px rgba(30,58,138,0.45), 0px 0px 16px rgba(96,165,250,0.20)',
      elevation: 6,
    },

    button: {
      shadowColor: Colors.accentShadow,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      boxShadow: '0px 6px 18px rgba(29,78,216,0.55), 0px 0px 14px rgba(96,165,250,0.35)',
      elevation: 7,
    },

    glow: {
      shadowColor: Colors.primaryGlow,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.55,
      shadowRadius: 18,
      boxShadow: '0px 0px 20px 3px rgba(96,165,250,0.55)',
      elevation: 12,
    },
  },
};

export default Theme;
