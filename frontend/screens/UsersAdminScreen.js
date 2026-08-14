import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import API from '../api';

export default function UsersAdminScreen({ authContext }) {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [password, setPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users', { headers: { Authorization: `Bearer ${authContext.token}` } });
      setUsers(res.data);
    } catch (error) {
      Alert.alert('Σφάλμα', 'Δεν φορτώθηκαν οι users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => { setEditingId(null); setName(''); setEmail(''); setRole('user'); setPassword(''); };
  const startEdit = (user) => { setEditingId(user.user_id); setName(user.name || ''); setEmail(user.email || ''); setRole(user.role || 'user'); setPassword(''); };

  const addUser = async () => {
    if (!name || !email || !password) {
      Alert.alert('Προσοχή', 'Συμπλήρωσε όνομα, email και password.');
      return;
    }
    try {
      await API.post('/auth/register', { name, email, password });
      const res = await API.get('/users', { headers: { Authorization: `Bearer ${authContext.token}` } });
      const newUser = res.data.find((u) => u.email === email);
      if (newUser) {
        await API.put(`/users/${newUser.user_id}`, { name, email, role }, { headers: { Authorization: `Bearer ${authContext.token}` } });
      }
      Alert.alert('Επιτυχία', 'Ο user προστέθηκε.');
      resetForm(); fetchUsers();
    } catch (error) {
      Alert.alert('Σφάλμα', error?.response?.data?.message || 'Δεν έγινε προσθήκη user.');
    }
  };

  const updateUser = async () => {
    try {
      await API.put(`/users/${editingId}`, { name, email, role }, { headers: { Authorization: `Bearer ${authContext.token}` } });
      Alert.alert('Επιτυχία', 'Ο user ενημερώθηκε.');
      resetForm(); fetchUsers();
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης.');
    }
  };

  const deleteUser = (id) => {
    Alert.alert('Διαγραφή User', 'Θέλεις σίγουρα να διαγράψεις αυτόν τον user;', [
      { text: 'Άκυρο', style: 'cancel' },
      { text: 'Διαγραφή', style: 'destructive', onPress: async () => {
        try {
          await API.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${authContext.token}` } });
          Alert.alert('Επιτυχία', 'Ο user διαγράφηκε.');
          fetchUsers();
        } catch (error) {
          Alert.alert('Σφάλμα', 'Η διαγραφή απέτυχε.');
        }
      }}
    ]);
  };

  const submitUser = () => editingId ? updateUser() : addUser();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Διαχείριση Users</Text>
      <TextInput style={styles.input} placeholder="Όνομα" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" />
      {!editingId && <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />}
      <TextInput style={styles.input} placeholder="Role: user ή admin" placeholderTextColor="#94A3B8" value={role} onChangeText={setRole} autoCapitalize="none" />
      <TouchableOpacity style={styles.saveButton} onPress={submitUser}><Text style={styles.buttonText}>{editingId ? 'Αποθήκευση αλλαγών' : 'Προσθήκη User'}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={resetForm}><Text style={styles.buttonText}>Καθαρισμός</Text></TouchableOpacity>
      <FlatList data={users} keyExtractor={(item) => item.user_id.toString()} renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardText}>{item.email}</Text>
          <Text style={styles.role}>Role: {item.role}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => startEdit(item)}><Text style={styles.buttonText}>Επεξεργασία</Text></TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteUser(item.user_id)}><Text style={styles.buttonText}>Διαγραφή</Text></TouchableOpacity>
        </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A13', padding: 16 },
  heading: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 14 },
  input: { backgroundColor: '#111827', color: '#FFF', borderWidth: 1, borderColor: '#263244', borderRadius: 14, padding: 13, marginBottom: 10 },
  saveButton: { backgroundColor: '#F97316', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  cancelButton: { backgroundColor: '#475569', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  editButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 8 },
  deleteButton: { backgroundColor: '#7F1D1D', padding: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '900' },
  card: { backgroundColor: '#111827', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#263244' },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  cardText: { color: '#CBD5E1', marginTop: 4 },
  role: { color: '#F97316', marginTop: 6, fontWeight: '900' }
});
