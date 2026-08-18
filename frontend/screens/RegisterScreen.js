import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

import API from '../api';

export default function RegisterScreen({ navigation }) {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const register = async () => {

    // Έλεγχος πεδίων
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert(
        'Αποτυχία εγγραφής',
        'Συμπλήρωσε όλα τα πεδία.'
      );
      return;
    }

    // Έλεγχος password
    if (password.length < 6) {
      Alert.alert(
        'Αποτυχία εγγραφής',
        'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.'
      );
      return;
    }

    try {

      setLoading(true);

      const response = await API.post(
        '/auth/register',
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password
        }
      );

      console.log(
        'REGISTER SUCCESS:',
        response.data
      );

      Alert.alert(
        'Επιτυχής εγγραφή',
        'Ο λογαριασμός δημιουργήθηκε με επιτυχία!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            }
          }
        ]
      );

      // Καθαρισμός
      setName('');
      setEmail('');
      setPassword('');

    } catch (error) {

      console.log(
        'REGISTER ERROR:',
        error?.response?.data || error.message
      );

      const message =
        error?.response?.data?.message ||
        'Δεν ήταν δυνατή η δημιουργία του λογαριασμού.Απαιτείται κωδικός έστω 9 χαρακτήρων ';

      Alert.alert(
        'Αποτυχία εγγραφής',
        message
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Cinema Booking
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#94A3B8"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton
        ]}
        onPress={register}
        disabled={loading}
      >

        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Register
          </Text>
        )}

      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
      >

        <Text style={styles.loginText}>
          Already have an account? Login
        </Text>

      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#070A13',
    padding: 20,
    justifyContent: 'center'
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6
  },

  subtitle: {
    color: '#F97316',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30
  },

  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#263244',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    marginBottom: 12,
    fontSize: 16
  },

  button: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },

  disabledButton: {
    backgroundColor: '#475569'
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900'
  },

  loginText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '700'
  }

});
