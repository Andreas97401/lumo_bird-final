import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface SettingsButtonProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ 
  size = 'medium', 
  style 
}) => {
  const router = useRouter();

  const getButtonStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      default:
        return 26;
    }
  };

  return (
    <TouchableOpacity 
      style={[getButtonStyle(), style]} 
      onPress={() => router.push('/SettingsPage')}
      accessibilityLabel="Paramètres"
      accessibilityRole="button"
    >
      <Ionicons name="settings-outline" size={getIconSize()} color="#C6E7E2" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  smallButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  mediumButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  largeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
}); 