import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface BottomNavBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const tabs = [
    {
      id: 'community',
      label: 'Communauté',
      icon: '👥',
      activeIcon: '👥',
    },
    {
      id: 'home',
      label: 'Accueil',
      icon: '🏠',
      activeIcon: '🏠',
    },
    {
      id: 'stats',
      label: 'Statistiques',
      icon: '📊',
      activeIcon: '📊',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => onTabPress(tab.id)}
        >
          <Text style={[
            styles.icon,
            activeTab === tab.id && styles.activeIcon
          ]}>
            {activeTab === tab.id ? tab.activeIcon : tab.icon}
          </Text>
          <Text style={[
            styles.label,
            activeTab === tab.id && styles.activeLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(198, 231, 226, 0.2)',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(253, 139, 90, 0.1)',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activeIcon: {
    fontSize: 26,
  },
  label: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.7)',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FD8B5A',
    fontWeight: 'bold',
  },
}); 