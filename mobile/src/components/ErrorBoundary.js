import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from './Icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mobile ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AlertCircle size={24} color={COLORS.red600} />
          </View>
          <Text style={styles.title}>Notice</Text>
          <Text style={styles.desc}>
            {this.props.message || 'An issue occurred in this section.'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleReset} activeOpacity={0.8}>
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.red200,
    alignItems: 'center',
    margin: SPACING.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.red50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
