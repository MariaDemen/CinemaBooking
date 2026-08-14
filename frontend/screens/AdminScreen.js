import React, {
  useEffect,
  useState
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  StyleSheet,
  ScrollView
} from 'react-native';

import * as ImagePicker
  from 'expo-image-picker';

import API from '../api';


export default function AdminScreen({
  navigation,
  authContext
}) {

  const [shows, setShows] =
    useState([]);

  const [theatreId, setTheatreId] =
    useState('1');

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [duration, setDuration] =
    useState('');

  const [ageRating, setAgeRating] =
    useState('');

  const [genre, setGenre] =
    useState('');

  const [language, setLanguage] =
    useState('');

  const [imageUrl, setImageUrl] =
    useState('');

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [editingId, setEditingId] =
    useState(null);


  /*
  =========================================================
  GET SHOWS
  =========================================================
  */

  const fetchShows = async () => {

    try {

      const res =
        await API.get('/shows');

      setShows(res.data);

    } catch (e) {

      console.log(
        'ADMIN SHOWS ERROR:',
        e?.response?.data ||
        e.message
      );

      Alert.alert(
        'Σφάλμα',
        'Δεν φορτώθηκαν οι παραστάσεις'
      );
    }
  };


  useEffect(() => {

    fetchShows();

  }, []);


  /*
  =========================================================
  IMAGE PICKER
  =========================================================
  */

  const pickImage = async () => {

    const result =
      await ImagePicker
        .launchImageLibraryAsync({

          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          quality: 1
        });


    if (!result.canceled) {

      setSelectedImage(
        result.assets[0]
      );
    }
  };


  /*
  =========================================================
  RESET FORM
  =========================================================
  */

  const resetForm = () => {

    setTheatreId('1');

    setTitle('');

    setDescription('');

    setDuration('');

    setAgeRating('');

    setGenre('');

    setLanguage('');

    setImageUrl('');

    setSelectedImage(null);

    setEditingId(null);
  };


  /*
  =========================================================
  CREATE / UPDATE SHOW
  =========================================================
  */

  const submitShow = async () => {

    try {

      const formData =
        new FormData();


      formData.append(
        'theatre_id',
        theatreId
      );

      formData.append(
        'title',
        title
      );

      formData.append(
        'description',
        description
      );

      formData.append(
        'duration',
        duration
      );

      formData.append(
        'age_rating',
        ageRating
      );

      formData.append(
        'genre',
        genre
      );

      formData.append(
        'language',
        language
      );

      formData.append(
        'image_url',
        imageUrl
      );


      if (selectedImage) {

        formData.append(
          'image',
          {
            uri:
              selectedImage.uri,

            name:
              'show-image.jpg',

            type:
              'image/jpeg'
          }
        );
      }


      const config = {

        headers: {

          Authorization:
            `Bearer ${authContext.token}`,

          'Content-Type':
            'multipart/form-data'
        }
      };


      if (editingId) {

        await API.put(
          `/shows/${editingId}`,
          formData,
          config
        );


        Alert.alert(
          'Επιτυχία',
          'Η παράσταση ενημερώθηκε'
        );

      } else {

        await API.post(
          '/shows',
          formData,
          config
        );


        Alert.alert(
          'Επιτυχία',
          'Η παράσταση προστέθηκε'
        );
      }


      resetForm();

      fetchShows();


    } catch (error) {

      console.log(
        'SAVE SHOW ERROR:',
        error?.response?.data ||
        error.message
      );


      Alert.alert(
        'Σφάλμα',
        error?.response?.data?.message ||
        'Η αποθήκευση απέτυχε'
      );
    }
  };


  /*
  =========================================================
  DELETE SHOW
  =========================================================
  */

  const deleteShow = async (id) => {

    Alert.alert(
      'Διαγραφή',
      'Θέλεις σίγουρα να διαγράψεις αυτή την παράσταση;',
      [
        {
          text: 'Ακύρωση',
          style: 'cancel'
        },

        {
          text: 'Διαγραφή',
          style: 'destructive',

          onPress: async () => {

            try {

              await API.delete(
                `/shows/${id}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${authContext.token}`
                  }
                }
              );


              Alert.alert(
                'Επιτυχία',
                'Η παράσταση διαγράφηκε'
              );


              fetchShows();


            } catch (e) {

              console.log(
                'DELETE SHOW ERROR:',
                e?.response?.data ||
                e.message
              );


              Alert.alert(
                'Σφάλμα',
                e?.response?.data?.message ||
                'Η διαγραφή απέτυχε'
              );
            }
          }
        }
      ]
    );
  };


  /*
  =========================================================
  START EDIT SHOW
  =========================================================
  */

  const startEdit = (item) => {

    setEditingId(
      item.show_id
    );

    setTheatreId(
      String(item.theatre_id)
    );

    setTitle(
      item.title || ''
    );

    setDescription(
      item.description || ''
    );

    setDuration(
      String(item.duration || '')
    );

    setAgeRating(
      item.age_rating || ''
    );

    setGenre(
      item.genre || ''
    );

    setLanguage(
      item.language || ''
    );

    setImageUrl(
      item.image_url || ''
    );

    setSelectedImage(null);
  };


  /*
  =========================================================
  IMAGE URL
  =========================================================
  */

  const renderImageUrl = (url) => {

    if (!url) {
      return null;
    }

    return url.startsWith('http')
      ? url
      : `${API.defaults.baseURL}${url}`;
  };


  /*
  =========================================================
  RENDER
  =========================================================
  */

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      <Text style={styles.heading}>
        Admin Panel
      </Text>


      {/* ================================================= */}
      {/* USERS */}
      {/* ================================================= */}

      <TouchableOpacity
        style={styles.usersButton}
        onPress={() =>
          navigation.navigate(
            'UsersAdmin'
          )
        }
      >

        <Text style={styles.buttonText}>
          Διαχείριση Users
        </Text>

      </TouchableOpacity>


      {/* ================================================= */}
      {/* RESERVATIONS */}
      {/* ================================================= */}

      <TouchableOpacity
        style={styles.reservationsButton}
        onPress={() =>
          navigation.navigate(
            'AdminReservations'
          )
        }
      >

        <Text style={styles.buttonText}>
          🎟️ Διαχείριση Κρατήσεων
        </Text>

      </TouchableOpacity>


      {/* ================================================= */}
      {/* SHOW FORM */}
      {/* ================================================= */}

      <Text style={styles.formTitle}>
        {editingId
          ? 'Επεξεργασία παράστασης'
          : 'Προσθήκη παράστασης'}
      </Text>


      <TextInput
        style={styles.input}
        placeholder="Theatre ID"
        placeholderTextColor="#94A3B8"
        value={theatreId}
        onChangeText={setTheatreId}
      />


      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#94A3B8"
        value={title}
        onChangeText={setTitle}
      />


      <TextInput
        style={[
          styles.input,
          styles.descriptionInput
        ]}
        placeholder="Description"
        placeholderTextColor="#94A3B8"
        value={description}
        onChangeText={setDescription}
        multiline
      />


      <TextInput
        style={styles.input}
        placeholder="Duration"
        placeholderTextColor="#94A3B8"
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
      />


      <TextInput
        style={styles.input}
        placeholder="Age rating"
        placeholderTextColor="#94A3B8"
        value={ageRating}
        onChangeText={setAgeRating}
      />


      <TextInput
        style={styles.input}
        placeholder="Genre"
        placeholderTextColor="#94A3B8"
        value={genre}
        onChangeText={setGenre}
      />


      <TextInput
        style={styles.input}
        placeholder="Language"
        placeholderTextColor="#94A3B8"
        value={language}
        onChangeText={setLanguage}
      />


      <TextInput
        style={styles.input}
        placeholder="Image URL ή επίλεξε φωτογραφία"
        placeholderTextColor="#94A3B8"
        value={imageUrl}
        onChangeText={setImageUrl}
      />


      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={pickImage}
      >

        <Text style={styles.buttonText}>
          Επιλογή φωτογραφίας
        </Text>

      </TouchableOpacity>


      <TouchableOpacity
        style={styles.button}
        onPress={submitShow}
      >

        <Text style={styles.buttonText}>
          {editingId
            ? 'Αποθήκευση αλλαγών'
            : 'Προσθήκη παράστασης'}
        </Text>

      </TouchableOpacity>


      <TouchableOpacity
        style={styles.cancelButton}
        onPress={resetForm}
      >

        <Text style={styles.buttonText}>
          Καθαρισμός
        </Text>

      </TouchableOpacity>


      {/* ================================================= */}
      {/* SHOW LIST */}
      {/* ================================================= */}

      <Text style={styles.listTitle}>
        Παραστάσεις
      </Text>


      {shows.map(item => (

        <View
          key={item.show_id}
          style={styles.card}
        >

          {item.image_url ? (

            <Image
              source={{
                uri:
                  renderImageUrl(
                    item.image_url
                  )
              }}
              style={styles.image}
            />

          ) : null}


          <Text style={styles.cardTitle}>
            {item.title}
          </Text>


          <Text style={styles.cardText}>
            {item.theatre_name}
          </Text>


          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              startEdit(item)
            }
          >

            <Text style={styles.buttonText}>
              Επεξεργασία
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() =>
              deleteShow(
                item.show_id
              )
            }
          >

            <Text style={styles.buttonText}>
              Διαγραφή
            </Text>

          </TouchableOpacity>

        </View>

      ))}

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

  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16
  },

  formTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 12
  },

  listTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 12
  },

  input: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#263244',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10
  },

  descriptionInput: {
    minHeight: 90,
    textAlignVertical: 'top'
  },

  usersButton: {
    backgroundColor: '#0F766E',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },

  reservationsButton: {
    backgroundColor: '#7C3AED',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },

  button: {
    backgroundColor: '#F97316',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },

  secondaryButton: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },

  cancelButton: {
    backgroundColor: '#475569',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14
  },

  editButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8
  },

  deleteButton: {
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#263244'
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8
  },

  cardText: {
    color: '#CBD5E1',
    marginTop: 4
  },

  image: {
    width: '100%',
    height: 180,
    borderRadius: 14
  }
});