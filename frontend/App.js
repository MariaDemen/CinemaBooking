import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { getToken, saveToken, deleteToken } from './authStorage';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ShowDetailsScreen from './screens/ShowDetailsScreen';
import ReservationsScreen from './screens/ReservationsScreen';
import AdminScreen from './screens/AdminScreen';
import UsersAdminScreen from './screens/UsersAdminScreen';

const Stack = createNativeStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#070A13',
    card: '#0D1220',
    text: '#FFFFFF',
    border: '#1F2937',
    primary: '#F97316'
  }
};

export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) setToken(storedToken);
      } catch (error) {
        console.log('LOAD TOKEN ERROR:', error);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const authContext = {
    token,
    login: async (newToken) => {
      await saveToken(newToken);
      setToken(newToken);
    },
    logout: async () => {
      await deleteToken();
      setToken(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#070A13', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#0D1220' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#070A13' }
      }}>
        {!token ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} authContext={authContext} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home">
              {(props) => <HomeScreen {...props} authContext={authContext} />}
            </Stack.Screen>
            <Stack.Screen name="ShowDetails" options={{ title: 'Show Details' }}>
              {(props) => <ShowDetailsScreen {...props} authContext={authContext} />}
            </Stack.Screen>
            <Stack.Screen name="Reservations" options={{ title: 'My Tickets' }}>
              {(props) => <ReservationsScreen {...props} authContext={authContext} />}
            </Stack.Screen>
            <Stack.Screen name="Admin">
              {(props) => <AdminScreen {...props} authContext={authContext} />}
            </Stack.Screen>
            <Stack.Screen name="UsersAdmin" options={{ title: 'Manage Users' }}>
              {(props) => <UsersAdminScreen {...props} authContext={authContext} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
