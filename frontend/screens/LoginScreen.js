import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import API from '../api';

export default function LoginScreen({ navigation, authContext }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }
    try {
      const res = await API.post('/auth/login', { email, password });
      Alert.alert('Success', 'Login successful!');
      await authContext.login(res.data.token);
    } catch (error) {
      Alert.alert('Login Failed', error?.response?.data?.message || 'Wrong email or password. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brand}>more theatre</Text>
        <Text style={styles.title}>Find your next stage experience</Text>
        <Text style={styles.subtitle}>Tickets, theatres and performances in one modern app.</Text>
      </View>

      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryButtonText}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A13', justifyContent: 'center', padding: 24 },
  hero: { backgroundColor: '#121826', borderRadius: 24, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: '#253045' },
  brand: { color: '#F97316', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', lineHeight: 38, marginBottom: 8 },
  subtitle: { color: '#CBD5E1', fontSize: 15, lineHeight: 22 },
  input: { backgroundColor: '#111827', color: '#FFF', borderWidth: 1, borderColor: '#263244', borderRadius: 14, padding: 15, marginBottom: 12 },
  button: { backgroundColor: '#F97316', padding: 15, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: { backgroundColor: '#1E293B', padding: 15, borderRadius: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});
