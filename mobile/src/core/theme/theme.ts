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
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.22,
      shadowRadius: 20,
      // Soft neutral depth only — no colored glow, keeps the frosted look
      boxShadow: '0px 6px 20px rgba(0,0,0,0.35)',
      elevation: 6,
      },

    button: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      // Neutral depth shadow only — colored glow removed
      boxShadow: '0px 6px 18px rgba(0,0,0,0.35)',
      elevation: 4,
    },

    glow: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.3,
      shadowRadius: 10,
      // Neutral depth shadow only — glow halo removed
      boxShadow: '0px 6px 16px rgba(0,0,0,0.35)',
      elevation: 4,
    },
  },
};

export default Theme;
