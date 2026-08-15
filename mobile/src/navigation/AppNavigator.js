import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../hooks/useUser';
import LoadingScreen from '../components/shared/LoadingScreen';
import StudentTabs from './StudentTabs';
import MentorTabs from './MentorTabs';
import UserProfileScreen from '../screens/shared/UserProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useUser();

  if (loading) {
    return <LoadingScreen message="Setting up your dashboard..." />;
  }

  const role = user?.role;
  const isMentor = role === 'mentor' || role === 'alumni';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MainTabs" 
        component={isMentor ? MentorTabs : StudentTabs} 
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
