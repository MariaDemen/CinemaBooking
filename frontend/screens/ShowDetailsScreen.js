import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ScrollView
} from 'react-native';

import API from '../api';


export default function ShowDetailsScreen({ route, authContext }) {

  const { show } = route.params;

  const [showtimes, setShowtimes] = useState([]);

  const [selectedShowtime, setSelectedShowtime] = useState(null);

  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(false);


  /*
   * LOAD SHOWTIMES
   */
  useEffect(() => {
    fetchShowtimes();
  }, []);


  const fetchShowtimes = async () => {

    try {

      const res = await API.get(
        `/shows/${show.show_id}/showtimes`
      );

      setShowtimes(res.data);

    } catch (error) {

      console.log(
        'SHOWTIMES ERROR:',
        error?.response?.data || error.message
      );

      Alert.alert(
        'Error',
        'Could not load movie showtimes.'
      );
    }
  };


  /*
   * IMAGE URL
   */
  const imageUrl = (url) => {

    if (!url) return null;

    if (url.startsWith('http')) {
      return url;
    }

    return `${API.defaults.baseURL}${url}`;
  };


  /*
   * GET OCCUPIED SEATS
   *
   * The showtime endpoint should return:
   *
   * occupied_seats: ["A1", "A2", "B5"]
   *
   * If it doesn't exist yet, we simply treat
   * the seats as available.
   */
  const occupiedSeats = useMemo(() => {

    if (!selectedShowtime) {
      return [];
    }

    return (
      selectedShowtime.occupied_seats ||
      selectedShowtime.reserved_seats ||
      []
    ).map(seat =>
      String(seat).toUpperCase()
    );

  }, [selectedShowtime]);


  /*
   * CREATE CINEMA SEAT LIST
   *
   * Example:
   *
   * A1 A2 A3 A4...
   * B1 B2 B3 B4...
   * C1 C2 C3 C4...
   *
   * 10 seats per row.
   */
  const seats = useMemo(() => {

    if (!selectedShowtime) {
      return [];
    }

    const totalSeats =
      Number(selectedShowtime.total_seats || 0);

    const seatsPerRow = 10;

    const numberOfRows =
      Math.ceil(totalSeats / seatsPerRow);

    const result = [];

    for (let row = 0; row < numberOfRows; row++) {

      const rowLetter =
        String.fromCharCode(65 + row);

      for (
        let number = 1;
        number <= seatsPerRow;
        number++
      ) {

        const seatIndex =
          row * seatsPerRow + number;

        if (seatIndex > totalSeats) {
          break;
        }

        result.push(`${rowLetter}${number}`);
      }
    }

    return result;

  }, [selectedShowtime]);


  /*
   * SELECT / UNSELECT SEAT
   */
  const toggleSeat = (seat) => {

    if (occupiedSeats.includes(seat)) {
      return;
    }

    setSelectedSeats(previous => {

      if (previous.includes(seat)) {

        return previous.filter(
          item => item !== seat
        );
      }

      return [...previous, seat];
    });
  };


  /*
   * SELECT SHOWTIME
   */
  const selectShowtime = (item) => {

    setSelectedShowtime(item);

    setSelectedSeats([]);
  };


  /*
   * RESERVATION
   */
  const reserve = async () => {

    if (!selectedShowtime) {

      Alert.alert(
        'Select Showtime',
        'Please select a movie time first.'
      );

      return;
    }


    if (selectedSeats.length === 0) {

      Alert.alert(
        'Select Seats',
        'Please select at least one seat.'
      );

      return;
    }


    const availableSeats =
      Number(selectedShowtime.available_seats || 0);


    if (
      availableSeats > 0 &&
      selectedSeats.length > availableSeats
    ) {

      Alert.alert(
        'Not enough seats',
        'There are not enough available seats.'
      );

      return;
    }


    try {

      setLoading(true);


      await API.post(
        '/reservations',
        {
          showtime_id:
            selectedShowtime.showtime_id,

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
        'Success',
        `Your seats ${selectedSeats.join(', ')} have been reserved successfully!`
      );


      setSelectedSeats([]);


      /*
       * Reload showtimes so the newly
       * reserved seats become unavailable.
       */
      await fetchShowtimes();


      /*
       * Keep selected showtime updated.
       */
      const updatedShowtimes =
        await API.get(
          `/shows/${show.show_id}/showtimes`
        );


      const updated =
        updatedShowtimes.data.find(
          item =>
            item.showtime_id ===
            selectedShowtime.showtime_id
        );


      if (updated) {
        setSelectedShowtime(updated);
      }

    } catch (error) {

      console.log(
        'RESERVATION ERROR:',
        error?.response?.data || error.message
      );


      Alert.alert(
        'Reservation Failed',
        error?.response?.data?.message ||
        'Reservation failed. Please try again.'
      );

    } finally {

      setLoading(false);
    }
  };


  /*
   * RENDER SEAT
   */
  const renderSeat = ({ item }) => {

    const isOccupied =
      occupiedSeats.includes(item);

    const isSelected =
      selectedSeats.includes(item);


    return (

      <TouchableOpacity
        disabled={isOccupied}
        onPress={() => toggleSeat(item)}
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


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      {/* ================================================= */}
      {/* MOVIE IMAGE */}
      {/* ================================================= */}

      {show.image_url ? (

        <Image
          source={{
            uri: imageUrl(show.image_url)
          }}
          style={styles.heroImage}
        />

      ) : null}


      {/* ================================================= */}
      {/* MOVIE INFORMATION */}
      {/* ================================================= */}

      <View style={styles.infoBox}>

        <Text style={styles.badge}>
          {show.genre || 'Cinema'}
        </Text>


        <Text style={styles.title}>
          {show.title}
        </Text>


        <Text style={styles.subtitle}>
          {show.theatre_name}
          {' • '}
          {show.location}
        </Text>


        <Text style={styles.description}>
          {show.description}
        </Text>


        <Text style={styles.meta}>
          {show.duration} minutes
          {' • '}
          {show.age_rating || 'All ages'}
          {' • '}
          {show.language || 'Language N/A'}
        </Text>

      </View>


      {/* ================================================= */}
      {/* SHOWTIMES */}
      {/* ================================================= */}

      <Text style={styles.sectionTitle}>
        Movie times
      </Text>


      {showtimes.length === 0 ? (

        <Text style={styles.emptyText}>
          No showtimes available.
        </Text>

      ) : (

        <View>

          {showtimes.map(item => {

            const isSelected =
              selectedShowtime?.showtime_id ===
              item.showtime_id;


            return (

              <TouchableOpacity
                key={item.showtime_id}
                onPress={() =>
                  selectShowtime(item)
                }
                style={[
                  styles.showtimeCard,

                  isSelected &&
                  styles.selectedShowtimeCard
                ]}
              >

                <View style={styles.showtimeInfo}>

                  <Text style={styles.date}>
                    {new Date(
                      item.show_date
                    ).toLocaleString()}
                  </Text>


                  <Text style={styles.text}>
                    Cinema hall: {item.hall}
                  </Text>


                  <Text style={styles.text}>
                    Available seats:{' '}
                    {item.available_seats}
                  </Text>

                </View>


                <View style={styles.priceBox}>

                  <Text style={styles.price}>
                    {item.base_price}€
                  </Text>


                  <Text
                    style={[
                      styles.selectText,

                      isSelected &&
                      styles.selectTextActive
                    ]}
                  >
                    {isSelected
                      ? 'Selected'
                      : 'Select'}
                  </Text>

                </View>

              </TouchableOpacity>
            );
          })}

        </View>
      )}


      {/* ================================================= */}
      {/* SEAT SELECTION */}
      {/* ================================================= */}

      {selectedShowtime && (

        <View style={styles.seatSection}>

          <Text style={styles.sectionTitle}>
            Select your seats
          </Text>


          <Text style={styles.screenText}>
            SCREEN
          </Text>


          <View style={styles.screen} />


          <View style={styles.legend}>

            <View style={styles.legendItem}>

              <View
                style={[
                  styles.legendSeat,
                  styles.availableLegend
                ]}
              />

              <Text style={styles.legendText}>
                Available
              </Text>

            </View>


            <View style={styles.legendItem}>

              <View
                style={[
                  styles.legendSeat,
                  styles.selectedLegend
                ]}
              />

              <Text style={styles.legendText}>
                Selected
              </Text>

            </View>


            <View style={styles.legendItem}>

              <View
                style={[
                  styles.legendSeat,
                  styles.occupiedLegend
                ]}
              />

              <Text style={styles.legendText}>
                Occupied
              </Text>

            </View>

          </View>


          <FlatList
            data={seats}
            keyExtractor={item => item}
            renderItem={renderSeat}
            numColumns={10}
            scrollEnabled={false}
            columnWrapperStyle={
              styles.seatRow
            }
            contentContainerStyle={
              styles.seatGrid
            }
          />


          {/* SELECTED SEATS */}

          <View style={styles.selectedBox}>

            <Text style={styles.selectedTitle}>
              Selected seats
            </Text>


            <Text style={styles.selectedSeatsText}>
              {selectedSeats.length > 0
                ? selectedSeats.join(', ')
                : 'No seats selected'}
            </Text>


            <Text style={styles.totalText}>
              Seats: {selectedSeats.length}
            </Text>


            <Text style={styles.totalPrice}>
              Total:{' '}
              {(
                Number(
                  selectedShowtime.base_price || 0
                ) *
                selectedSeats.length
              ).toFixed(2)}
              €
            </Text>

          </View>


          {/* RESERVE BUTTON */}

          <TouchableOpacity
            style={[
              styles.reserveButton,

              (
                selectedSeats.length === 0 ||
                loading
              ) &&
              styles.disabledButton
            ]}
            disabled={
              selectedSeats.length === 0 ||
              loading
            }
            onPress={reserve}
          >

            <Text style={styles.reserveButtonText}>

              {loading
                ? 'Booking...'
                : 'Book selected seats'}

            </Text>

          </TouchableOpacity>

        </View>
      )}

    </ScrollView>
  );
}


/* ========================================================= */
/* STYLES */
/* ========================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#070A13'
  },

  content: {
    padding: 16,
    paddingBottom: 40
  },

  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: 22,
    marginBottom: 14,
    backgroundColor: '#1E293B'
  },

  infoBox: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 20
  },

  badge: {
    color: '#F97316',
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase'
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 5
  },

  subtitle: {
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '700'
  },

  description: {
    color: '#E2E8F0',
    lineHeight: 21,
    marginBottom: 10
  },

  meta: {
    color: '#CBD5E1',
    fontWeight: '800'
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 5
  },

  showtimeCard: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#263244',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  selectedShowtimeCard: {
    borderColor: '#F97316',
    borderWidth: 2
  },

  showtimeInfo: {
    flex: 1
  },

  date: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 6
  },

  text: {
    color: '#CBD5E1',
    marginBottom: 3
  },

  priceBox: {
    alignItems: 'flex-end',
    marginLeft: 10
  },

  price: {
    color: '#F97316',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 7
  },

  selectText: {
    color: '#94A3B8',
    fontWeight: '900'
  },

  selectTextActive: {
    color: '#F97316'
  },

  seatSection: {
    marginTop: 12,
    backgroundColor: '#0D1220',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#263244'
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
    marginBottom: 18,
    flexWrap: 'wrap'
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

  selectedSeatsText: {
    color: '#F97316',
    fontWeight: '900',
    marginBottom: 8
  },

  totalText: {
    color: '#CBD5E1',
    marginBottom: 4
  },

  totalPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },

  reserveButton: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12
  },

  disabledButton: {
    backgroundColor: '#475569'
  },

  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },

  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 20
  }

});