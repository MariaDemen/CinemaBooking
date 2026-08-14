import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import API from '../api';

export default function ReservationsScreen({ authContext }) {
  const [reservations, setReservations] = useState([]);

  const fetchReservations = async () => {
    try {
      const res = await API.get('/reservations/my', { headers: { Authorization: `Bearer ${authContext.token}` } });
      setReservations(res.data);
    } catch (error) {
      console.log('RESERVATIONS ERROR:', error?.response?.data || error.message);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const imageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API.defaults.baseURL}${url}`;
  };

  const cancelReservation = async (id) => {
    try {
      await API.delete(`/reservations/${id}`, { headers: { Authorization: `Bearer ${authContext.token}` } });
      Alert.alert('Success', 'Reservation cancelled.');
      fetchReservations();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Cancel failed.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Τα εισιτήριά μου</Text>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.reservation_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image_url ? <Image source={{ uri: imageUrl(item.image_url) }} style={styles.poster} /> : null}
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.text}>{item.theatre_name}</Text>
              <Text style={styles.text}>{new Date(item.show_date).toLocaleString()}</Text>
              <Text style={styles.text}>Θέσεις: {item.seats_count} • Σύνολο: {item.total_price}€</Text>
              <Text style={styles.status}>Status: {item.status}</Text>
              {item.status === 'ACTIVE' && (
                <TouchableOpacity style={styles.cancelButton} onPress={() => cancelReservation(item.reservation_id)}>
                  <Text style={styles.buttonText}>Ακύρωση</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Δεν υπάρχουν κρατήσεις.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A13', padding: 16 },
  heading: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 14 },
  card: { backgroundColor: '#111827', borderRadius: 18, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#263244', flexDirection: 'row', gap: 12 },
  poster: { width: 92, height: 130, borderRadius: 12, backgroundColor: '#1E293B' },
  body: { flex: 1 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  text: { color: '#CBD5E1', marginBottom: 3 },
  status: { color: '#F97316', fontWeight: '900', marginTop: 4 },
  cancelButton: { backgroundColor: '#7F1D1D', padding: 10, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: '900' },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 30 }
});
