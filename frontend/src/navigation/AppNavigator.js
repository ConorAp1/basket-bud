import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ScanReceiptScreen from '../screens/ScanReceiptScreen';
import ReceiptReviewScreen from '../screens/ReceiptReviewScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CompareScreen from '../screens/CompareScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#2d6a4f', headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Receipts' }} />
      <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ title: 'Scan Receipt' }} />
      <Stack.Screen name="ReceiptReview" component={ReceiptReviewScreen} options={{ title: 'Receipt Detail' }} />
    </Stack.Navigator>
  );
}

function CompareStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#2d6a4f', headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="CompareScreen" component={CompareScreen} options={{ title: 'Compare Prices' }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Receipts: '🧾',
  Compare: '📊',
  Dashboard: '📈',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>{TAB_ICONS[route.name] || '●'}</Text>,
          tabBarActiveTintColor: '#2d6a4f',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: { borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 4, height: 60 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
      >
        <Tab.Screen name="Receipts" component={HomeStack} />
        <Tab.Screen name="Compare" component={CompareStack} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: true, title: 'Analytics', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '700', color: '#1a1a2e' } }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
