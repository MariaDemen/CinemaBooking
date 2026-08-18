import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import API from '../api';

export default function HomeScreen({ navigation, authContext }) {
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const decoded = jwtDecode(authContext.token);
      setIsAdmin(decoded.role === 'admin');
    } catch (error) {
      console.log('JWT DECODE ERROR:', error);
    }
  }, [authContext.token]);

  const fetchShows = async () => {
    try {
      const res = await API.get('/shows', { params: { title: search } });
      setShows(res.data);
    } catch (error) {
      console.log('FETCH SHOWS ERROR:', error?.response?.data || error.message);
    }
  };

  const fetchTheatres = async () => {
    try {
      const res = await API.get('/theatres');
      setTheatres(res.data);
    } catch (error) {
      console.log('FETCH THEATRES ERROR:', error?.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchShows();
    fetchTheatres();
  }, []);

  const imageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API.defaults.baseURL}${url}`;
  };

  const renderShow = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ShowDetails', { show: item })}>
      {item.image_url ? <Image source={{ uri: imageUrl(item.image_url) }} style={styles.poster} /> : <View style={styles.posterPlaceholder}><Text style={styles.placeholderText}>🎭</Text></View>}
      <View style={styles.cardBody}>
        <Text style={styles.badge}>{item.genre || 'Theatre'}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardText}>{item.theatre_name}</Text>
        <Text style={styles.cardText}>{item.location} • {item.duration} λεπτά</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={shows}
        keyExtractor={(item) => item.show_id.toString()}
        renderItem={renderShow}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}>CINEMA BOOKING</Text>
                <Text style={styles.heading}>Cinematic experience</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={authContext.logout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Book your next cinema night</Text>
              <Text style={styles.heroText}>Discover movies and available dates.</Text>
            </View>

            {isAdmin && (
              <TouchableOpacity style={styles.adminButton} onPress={() => navigation.navigate('Admin')}>
                <Text style={styles.buttonText}>Admin Panel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.ticketsButton} onPress={() => navigation.navigate('Reservations')}>
              <Text style={styles.buttonText}>My tickets</Text>
            </TouchableOpacity>

            <View style={styles.searchWrap}>
              <TextInput style={styles.input} placeholder="Search movie" placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} />
              <TouchableOpacity style={styles.searchButton} onPress={fetchShows}>
                <Text style={styles.buttonText}>Search</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Cinema</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.theatresScroll}>
              {theatres.map((t) => (
                <View key={t.theatre_id} style={styles.theatrePill}>
                  <Text style={styles.theatreName}>{t.name}</Text>
                  <Text style={styles.theatreLocation}>{t.location}</Text>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Playing now</Text>
          </>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A13' },
  listContent: { padding: 16, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  kicker: { color: '#F97316', fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },
  heading: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  logoutButton: { backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  logoutText: { color: '#FFF', fontWeight: '800' },
  hero: { backgroundColor: '#121826', borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#253045' },
  heroTitle: { color: '#FFF', fontSize: 25, fontWeight: '900', marginBottom: 6 },
  heroText: { color: '#CBD5E1', lineHeight: 21 },
  adminButton: { backgroundColor: '#0F766E', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  ticketsButton: { backgroundColor: '#F97316', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  searchWrap: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  input: { flex: 1, backgroundColor: '#111827', color: '#FFF', borderWidth: 1, borderColor: '#263244', borderRadius: 14, padding: 13 },
  searchButton: { backgroundColor: '#334155', borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  buttonText: { color: '#FFF', fontWeight: '900' },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 10, marginTop: 4 },
  theatresScroll: { marginBottom: 18 },
  theatrePill: { backgroundColor: '#111827', borderRadius: 18, padding: 14, marginRight: 10, minWidth: 180, borderWidth: 1, borderColor: '#263244' },
  theatreName: { color: '#FFF', fontWeight: '900' },
  theatreLocation: { color: '#94A3B8', marginTop: 4 },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#111827', borderRadius: 18, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#263244' },
  poster: { width: '100%', height: 190, backgroundColor: '#1E293B' },
  posterPlaceholder: { height: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' },
  placeholderText: { fontSize: 42 },
  cardBody: { padding: 12 },
  badge: { color: '#F97316', fontSize: 12, fontWeight: '900', marginBottom: 5 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 5 },
  cardText: { color: '#CBD5E1', fontSize: 12, marginBottom: 2 }
});
