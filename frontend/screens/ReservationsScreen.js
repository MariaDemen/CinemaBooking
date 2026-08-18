import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';

import API from '../api';

export default function ReservationsScreen({ authContext }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
   * Check if logged-in user is admin
   */
  const isAdmin = authContext?.user?.role === 'admin';

  /*
   * =========================================================
   * IMAGE URL
   * =========================================================
   */

  const imageUrl = (url) => {
    if (!url) return null;

    if (url.startsWith('http')) {
      return url;
    }

    return `${API.defaults.baseURL}${url}`;
  };

  /*
   * =========================================================
   * LOAD RESERVATIONS
   * =========================================================
   *
   * USER:
   * GET /reservations/my
   *
   * ADMIN:
   * GET /reservations/admin/all
   */

  const fetchReservations = async () => {
    try {
      setLoading(true);

      const endpoint = isAdmin
        ? '/reservations/admin/all'
        : '/reservations/my';

      const res = await API.get(endpoint, {
        headers: {
          Authorization: `Bearer ${authContext.token}`
        }
      });

      setReservations(res.data);

    } catch (error) {
      console.log(
        'RESERVATIONS ERROR:',
        error?.response?.data || error.message
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
        'Could not load reservations.'
      );

    } finally {
      setLoading(false);
    }
  };

  /*
   * Load reservations when screen opens
   */

  useEffect(() => {
    fetchReservations();
  }, [isAdmin]);

  /*
   * =========================================================
   * USER CANCEL RESERVATION
   * =========================================================
   */

  const cancelUserReservation = async (id) => {
    Alert.alert(
      'Ακύρωση κράτησης',
      'Θέλεις σίγουρα να ακυρώσεις αυτή την κράτηση;',
      [
        {
          text: 'Όχι',
          style: 'cancel'
        },
        {
          text: 'Ναι, ακύρωση',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete(
                `/reservations/${id}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${authContext.token}`
                  }
                }
              );

              Alert.alert(
                'Επιτυχία',
                'Η κράτηση ακυρώθηκε.'
              );

              fetchReservations();

            } catch (error) {
              console.log(
                'USER CANCEL ERROR:',
                error?.response?.data ||
                error.message
              );

              Alert.alert(
                'Σφάλμα',
                error?.response?.data?.message ||
                'Η ακύρωση απέτυχε.'
              );
            }
          }
        }
      ]
    );
  };

  /*
   * =========================================================
   * ADMIN CANCEL RESERVATION
   * =========================================================
   */

  const cancelAdminReservation = async (id) => {
    Alert.alert(
      'Ακύρωση κράτησης',
      'Θέλεις σίγουρα να ακυρώσεις αυτή την κράτηση;',
      [
        {
          text: 'Όχι',
          style: 'cancel'
        },
        {
          text: 'Ναι, ακύρωση',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete(
                `/reservations/admin/${id}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${authContext.token}`
                  }
                }
              );

              Alert.alert(
                'Επιτυχία',
                'Η κράτηση ακυρώθηκε επιτυχώς.'
              );

              fetchReservations();

            } catch (error) {
              console.log(
                'ADMIN CANCEL ERROR:',
                error?.response?.data ||
                error.message
              );

              Alert.alert(
                'Σφάλμα',
                error?.response?.data?.message ||
                'Η ακύρωση της κράτησης απέτυχε.'
              );
            }
          }
        }
      ]
    );
  };

  /*
   * =========================================================
   * RENDER RESERVATION
   * =========================================================
   */

  const renderReservation = ({ item }) => {
    const isActive = item.status === 'ACTIVE';

    return (
      <View style={styles.card}>

        {/* IMAGE */}

        {item.image_url ? (
          <Image
            source={{
              uri: imageUrl(item.image_url)
            }}
            style={styles.poster}
          />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>
              🎬
            </Text>
          </View>
        )}

        {/* BODY */}

        <View style={styles.body}>

          {/* MOVIE */}

          <Text style={styles.title}>
            {item.title}
          </Text>

          {/* ADMIN USER INFORMATION */}

          {isAdmin && (
            <View style={styles.userBox}>

              <Text style={styles.userLabel}>
                Κρατήθηκε από
              </Text>

              <Text style={styles.userName}>
                {item.user_name}
              </Text>

              <Text style={styles.userEmail}>
                {item.user_email}
              </Text>

            </View>
          )}

          {/* CINEMA */}

          <Text style={styles.text}>
            🎬 {item.theatre_name}
          </Text>

          {item.location ? (
            <Text style={styles.text}>
              📍 {item.location}
            </Text>
          ) : null}

          {/* DATE */}

          <Text style={styles.text}>
             {new Date(
              item.show_date
            ).toLocaleString()}
          </Text>

          {/* HALL */}

          <Text style={styles.text}>
             Αίθουσα: {item.hall}
          </Text>

          {/* SEATS */}

          <Text style={styles.seats}>
            Θέσεις:{' '}
            {item.seat_numbers ||
              `${item.seats_count} θέσεις`}
          </Text>

          {/* PRICE */}

          <Text style={styles.price}>
            Σύνολο: {item.total_price}€
          </Text>

          {/* STATUS */}

          <View
            style={[
              styles.statusBox,
              isActive
                ? styles.activeStatusBox
                : styles.cancelledStatusBox
            ]}
          >
            <Text
              style={[
                styles.status,
                isActive
                  ? styles.activeStatus
                  : styles.cancelledStatus
              ]}
            >
              {isActive
                ? 'ACTIVE'
                : 'CANCELLED'}
            </Text>
          </View>

          {/* USER CANCEL */}

          {!isAdmin && isActive && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                cancelUserReservation(
                  item.reservation_id
                )
              }
            >
              <Text style={styles.buttonText}>
                Ακύρωση κράτησης
              </Text>
            </TouchableOpacity>
          )}

          {/* ADMIN CANCEL */}

          {isAdmin && isActive && (
            <TouchableOpacity
              style={styles.adminCancelButton}
              onPress={() =>
                cancelAdminReservation(
                  item.reservation_id
                )
              }
            >
              <Text style={styles.buttonText}>
                Ακύρωση κράτησης
              </Text>
            </TouchableOpacity>
          )}

        </View>

      </View>
    );
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#F97316"
        />

        <Text style={styles.loadingText}>
          Φόρτωση κρατήσεων...
        </Text>

      </View>
    );
  }

  /*
   * =========================================================
   * SCREEN
   * =========================================================
   */

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <Text style={styles.heading}>
        {isAdmin
          ? 'Διαχείριση Κρατήσεων'
          : 'Τα εισιτήριά μου'}
      </Text>

      {isAdmin && (
        <Text style={styles.adminInfo}>
          Εδώ εμφανίζονται όλες οι κρατήσεις χρηστών.
        </Text>
      )}

      {/* RESERVATIONS */}

      <FlatList
        data={reservations}
        keyExtractor={(item) =>
          item.reservation_id.toString()
        }
        renderItem={renderReservation}
        showsVerticalScrollIndicator={false}

        ListEmptyComponent={
          <View style={styles.emptyContainer}>

            <Text style={styles.emptyIcon}>
              🎟️
            </Text>

            <Text style={styles.empty}>
              {isAdmin
                ? 'Δεν υπάρχουν κρατήσεις.'
                : 'Δεν υπάρχουν κρατήσεις.'}
            </Text>

          </View>
        }

        contentContainerStyle={
          reservations.length === 0
            ? styles.emptyList
            : styles.list
        }
      />

    </View>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#070A13',
    padding: 16
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#070A13',
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingText: {
    color: '#CBD5E1',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700'
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6
  },

  adminInfo: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 14
  },

  list: {
    paddingBottom: 30
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: 'center'
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 10
  },

  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700'
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#263244',
    flexDirection: 'row'
  },

  poster: {
    width: 92,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#1E293B'
  },

  noImage: {
    width: 92,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center'
  },

  noImageText: {
    fontSize: 35
  },

  body: {
    flex: 1,
    marginLeft: 12
  },

  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 7
  },

  text: {
    color: '#CBD5E1',
    marginBottom: 4,
    fontSize: 13
  },

  seats: {
    color: '#F97316',
    fontWeight: '900',
    marginTop: 5,
    marginBottom: 5
  },

  price: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 7
  },

  /*
   * ADMIN USER BOX
   */

  userBox: {
    backgroundColor: '#0D1220',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#263244'
  },

  userLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },

  userEmail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2
  },

  /*
   * STATUS
   */

  statusBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2
  },

  activeStatusBox: {
    backgroundColor: '#064E3B'
  },

  cancelledStatusBox: {
    backgroundColor: '#450A0A'
  },

  status: {
    fontSize: 12,
    fontWeight: '900'
  },

  activeStatus: {
    color: '#6EE7B7'
  },

  cancelledStatus: {
    color: '#FCA5A5'
  },

  /*
   * USER CANCEL
   */

  cancelButton: {
    backgroundColor: '#7F1D1D',
    padding: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },

  /*
   * ADMIN CANCEL
   */

  adminCancelButton: {
    backgroundColor: '#B91C1C',
    padding: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EF4444'
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13
  }

});
