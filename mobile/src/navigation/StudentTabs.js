import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, FontSize } from '../theme/colors';

// Student screens
import HomeScreen from '../screens/student/HomeScreen';
import JobsScreen from '../screens/student/JobsScreen';
import EventsScreen from '../screens/student/EventsScreen';
import MentorDirectoryScreen from '../screens/student/MentorDirectoryScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabs = [
  { name: 'Home', component: HomeScreen, icon: 'home', label: 'Home' },
  { name: 'Jobs', component: JobsScreen, icon: 'briefcase', label: 'Jobs' },
  { name: 'Events', component: EventsScreen, icon: 'calendar', label: 'Events' },
  { name: 'Mentors', component: MentorDirectoryScreen, icon: 'people', label: 'Mentors' },
  { name: 'Profile', component: ProfileScreen, icon: 'person', label: 'Me' },
];

function TabIcon({ name, focused, label }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      {focused && (
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={22}
        color={focused ? '#fff' : Colors.tabInactive}
      />
      <Text style={[styles.tabLabel, { color: focused ? '#fff' : Colors.tabInactive }]}>
        {label}
      </Text>
    </View>
  );
}

export default function StudentTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBg,
          borderTopColor: Colors.tabBorder,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name={tab.icon} focused={focused} label={tab.label} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 2,
    overflow: 'hidden',
    minWidth: 60,
  },
  tabItemActive: {
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
