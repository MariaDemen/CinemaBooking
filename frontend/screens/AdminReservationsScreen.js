import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';

import API from '../api';


export default function AdminEditReservationScreen({
  navigation,
  route,
  authContext
}) {

  const {
    reservation
  } = route.params;


  const [occupiedSeats, setOccupiedSeats] =
    useState([]);

  const [selectedSeats, setSelectedSeats] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  /*
  =========================================================
  LOAD OCCUPIED SEATS
  =========================================================
  */

  const loadSeats = async () => {

    try {

      setLoading(true);


      const response =
        await API.get(
          `/reservations/admin/showtime/${reservation.showtime_id}/seats`,
          {
            headers: {
              Authorization:
                `Bearer ${authContext.token}`
            }
          }
        );


      /*
      All occupied seats except
      the seats of the reservation
      we are editing.
      */

      const otherOccupiedSeats =
        response.data
          .filter(
            item =>
              Number(
                item.reservation_id
              ) !==
              Number(
                reservation.reservation_id
              )
          )
          .map(
            item =>
              String(
                item.seat_number
              ).toUpperCase()
          );


      setOccupiedSeats(
        otherOccupiedSeats
      );


      /*
      Start with current reservation seats
      */

      const currentSeats =
        reservation.seat_numbers
          ? reservation.seat_numbers
              .split(',')
              .map(seat =>
                seat.trim().toUpperCase()
              )
              .filter(Boolean)
          : [];


      setSelectedSeats(
        currentSeats
      );


    } catch (error) {

      console.log(
        'ADMIN LOAD SEATS ERROR:',
        error?.response?.data ||
        error.message
      );


      Alert.alert(
        'Σφάλμα',
        error?.response?.data?.message ||
        'Δεν φορτώθηκαν οι θέσεις.'
      );


    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    loadSeats();

  }, []);


  /*
  =========================================================
  CREATE SEATS
  =========================================================
  */

  const seats = useMemo(() => {

    const totalSeats =
      Number(
        reservation.total_seats || 0
      );


    const seatsPerRow = 10;

    const numberOfRows =
      Math.ceil(
        totalSeats /
        seatsPerRow
      );


    const result = [];


    for (
      let row = 0;
      row < numberOfRows;
      row++
    ) {

      const rowLetter =
        String.fromCharCode(
          65 + row
        );


      for (
        let number = 1;
        number <= seatsPerRow;
        number++
      ) {

        const seatIndex =
          row *
            seatsPerRow +
          number;


        if (
          seatIndex >
          totalSeats
        ) {
          break;
        }


        result.push(
          `${rowLetter}${number}`
        );
      }
    }


    return result;

  }, [reservation.total_seats]);


  /*
  =========================================================
  TOGGLE SEAT
  =========================================================
  */

  const toggleSeat = (seat) => {

    /*
    Cannot select another
    reservation's seat.
    */

    if (
      occupiedSeats.includes(
        seat
      )
    ) {
      return;
    }


    setSelectedSeats(
      previous => {

        if (
          previous.includes(
            seat
          )
        ) {

          return previous.filter(
            item =>
              item !== seat
          );
        }


        return [
          ...previous,
          seat
        ];
      }
    );
  };


  /*
  =========================================================
  SAVE
  =========================================================
  */

  const saveSeats = async () => {

    if (
      selectedSeats.length === 0
    ) {

      Alert.alert(
        'Θέσεις',
        'Πρέπει να επιλέξεις τουλάχιστον μία θέση.'
      );

      return;
    }


    try {

      setSaving(true);


      await API.put(
        `/reservations/admin/${reservation.reservation_id}/seats`,
        {
          seat_numbers:
            selectedSeats
        },
        {
          headers: {
            Authorization:
              `Bearer ${authContext.token}`
          }
        }
      );


      Alert.alert(
        'Επιτυχία',
        'Οι θέσεις της κράτησης ενημερώθηκαν.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack()
          }
        ]
      );


    } catch (error) {

      console.log(
        'ADMIN SAVE SEATS ERROR:',
        error?.response?.data ||
        error.message
      );


      Alert.alert(
        'Αποτυχία',
        error?.response?.data?.message ||
        'Δεν ήταν δυνατή η αλλαγή των θέσεων.'
      );


    } finally {

      setSaving(false);
    }
  };


  /*
  =========================================================
  RENDER SEAT
  =========================================================
  */

  const renderSeat =
    ({ item }) => {

      const isOccupied =
        occupiedSeats.includes(
          item
        );


      const isSelected =
        selectedSeats.includes(
          item
        );


      return (

        <TouchableOpacity
          disabled={
            isOccupied
          }
          onPress={() =>
            toggleSeat(item)
          }
          style={[
            styles.seat,

            isOccupied &&
              styles.occupiedSeat,

            isSelected &&
              styles.selectedSeat
          ]}
        >

          <Text
            style={[
              styles.seatText,

              isOccupied &&
                styles.occupiedSeatText,

              isSelected &&
                styles.selectedSeatText
            ]}
          >
            {item}
          </Text>

        </TouchableOpacity>
      );
    };


  /*
  =========================================================
  LOADING
  =========================================================
  */

  if (loading) {

    return (

      <View
        style={styles.loading}
      >

        <ActivityIndicator
          size="large"
          color="#F97316"
        />

        <Text
          style={styles.loadingText}
        >
          Φόρτωση θέσεων...
        </Text>

      </View>
    );
  }


  /*
  =========================================================
  PRICE
  =========================================================
  */

  const totalPrice =
    Number(
      reservation.base_price || 0
    ) *
    selectedSeats.length;


  /*
  =========================================================
  SCREEN
  =========================================================
  */

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      <Text
        style={styles.title}
      >
        Επεξεργασία Κράτησης
      </Text>


      <View
        style={styles.infoBox}
      >

        <Text
          style={styles.movie}
        >
          {reservation.title}
        </Text>


        <Text
          style={styles.info}
        >
          Πελάτης:{' '}
          {reservation.user_name}
        </Text>


        <Text
          style={styles.info}
        >
          Email:{' '}
          {reservation.user_email}
        </Text>


        <Text
          style={styles.info}
        >
          Hall:{' '}
          {reservation.hall}
        </Text>


        <Text
          style={styles.info}
        >
          Τιμή θέσης:{' '}
          {Number(
            reservation.base_price || 0
          ).toFixed(2)}€
        </Text>

      </View>


      <Text
        style={styles.sectionTitle}
      >
        Επιλογή θέσεων
      </Text>


      <Text
        style={styles.screenText}
      >
        SCREEN
      </Text>


      <View
        style={styles.screen}
      />


      <View
        style={styles.legend}
      >

        <View
          style={styles.legendItem}
        >

          <View
            style={[
              styles.legendSeat,
              styles.availableLegend
            ]}
          />

          <Text
            style={styles.legendText}
          >
            Διαθέσιμη
          </Text>

        </View>


        <View
          style={styles.legendItem}
        >

          <View
            style={[
              styles.legendSeat,
              styles.selectedLegend
            ]}
          />

          <Text
            style={styles.legendText}
          >
            Επιλεγμένη
          </Text>

        </View>


        <View
          style={styles.legendItem}
        >

          <View
            style={[
              styles.legendSeat,
              styles.occupiedLegend
            ]}
          />

          <Text
            style={styles.legendText}
          >
            Κατειλημμένη
          </Text>

        </View>

      </View>


      <FlatList
        data={seats}
        keyExtractor={
          item => item
        }
        renderItem={
          renderSeat
        }
        numColumns={10}
        scrollEnabled={false}
        columnWrapperStyle={
          styles.seatRow
        }
        contentContainerStyle={
          styles.seatGrid
        }
      />


      <View
        style={styles.selectedBox}
      >

        <Text
          style={styles.selectedTitle}
        >
          Επιλεγμένες θέσεις
        </Text>


        <Text
          style={styles.selectedSeats}
        >
          {selectedSeats.length > 0
            ? selectedSeats.join(', ')
            : 'Καμία θέση'}
        </Text>


        <Text
          style={styles.count}
        >
          Θέσεις:{' '}
          {selectedSeats.length}
        </Text>


        <Text
          style={styles.total}
        >
          Σύνολο:{' '}
          {totalPrice.toFixed(2)}€
        </Text>

      </View>


      <TouchableOpacity
        style={[
          styles.saveButton,

          (
            selectedSeats.length === 0 ||
            saving
          ) &&
            styles.disabledButton
        ]}
        disabled={
          selectedSeats.length === 0 ||
          saving
        }
        onPress={saveSeats}
      >

        <Text
          style={styles.saveText}
        >
          {saving
            ? 'Αποθήκευση...'
            : 'Αποθήκευση θέσεων'}
        </Text>

      </TouchableOpacity>


      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.goBack()
        }
      >

        <Text
          style={styles.backText}
        >
          Επιστροφή
        </Text>

      </TouchableOpacity>

    </ScrollView>
  );
}


/*
=========================================================
STYLES
=========================================================
*/

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#070A13'
  },

  content: {
    padding: 16,
    paddingBottom: 40
  },

  loading: {
    flex: 1,
    backgroundColor: '#070A13',
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingText: {
    color: '#CBD5E1',
    marginTop: 12,
    fontWeight: '700'
  },

  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 14
  },

  infoBox: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 20
  },

  movie: {
    color: '#F97316',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 10
  },

  info: {
    color: '#CBD5E1',
    marginBottom: 5
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 12
  },

  screenText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 5
  },

  screen: {
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 30,
    marginBottom: 18
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 18
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    marginBottom: 5
  },

  legendSeat: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 5
  },

  availableLegend: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#64748B'
  },

  selectedLegend: {
    backgroundColor: '#F97316'
  },

  occupiedLegend: {
    backgroundColor: '#7F1D1D'
  },

  legendText: {
    color: '#CBD5E1',
    fontSize: 11
  },

  seatGrid: {
    alignItems: 'center',
    paddingBottom: 10
  },

  seatRow: {
    justifyContent: 'center'
  },

  seat: {
    width: 30,
    height: 30,
    margin: 3,
    borderRadius: 7,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center'
  },

  seatText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '800'
  },

  selectedSeat: {
    backgroundColor: '#F97316',
    borderColor: '#FB923C'
  },

  selectedSeatText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },

  occupiedSeat: {
    backgroundColor: '#7F1D1D',
    borderColor: '#991B1B'
  },

  occupiedSeatText: {
    color: '#FCA5A5'
  },

  selectedBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#263244'
  },

  selectedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6
  },

  selectedSeats: {
    color: '#F97316',
    fontWeight: '900',
    marginBottom: 8
  },

  count: {
    color: '#CBD5E1',
    marginBottom: 4
  },

  total: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },

  saveButton: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14
  },

  disabledButton: {
    backgroundColor: '#475569'
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },

  backButton: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10
  },

  backText: {
    color: '#FFFFFF',
    fontWeight: '900'
  }
});