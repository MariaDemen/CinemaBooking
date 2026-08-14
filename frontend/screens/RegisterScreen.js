import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import API from '../api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    try {
      await API.post('/auth/register', { name, email, password });
      Alert.alert('Success', 'Account created successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Registration Failed', e?.response?.data?.message || 'Could not create account. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join and book your next theatre ticket.</Text>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A13', justifyContent: 'center', padding: 24 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#111827', color: '#FFF', borderWidth: 1, borderColor: '#263244', borderRadius: 14, padding: 15, marginBottom: 12 },
  button: { backgroundColor: '#F97316', padding: 15, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
