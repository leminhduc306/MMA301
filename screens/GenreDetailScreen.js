import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { songService } from '../services/songService';
import { albumService } from '../services/albumService';
import { MusicContext } from '../context/MusicContext';

const GenreDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { genre } = route.params; // Get genre object from navigation params

  const { playSong, isFavorite, toggleFavorite } = useContext(MusicContext);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch songs belonging to this genre
        const allSongs = await songService.getAllSongs();
        const genreSongs = allSongs.filter(
          song => song.genre && song.genre.toLowerCase() === genre.name.toLowerCase()
        );
        setSongs(genreSongs);

        // Fetch albums belonging to this genre
        const allAlbums = await albumService.getAllAlbums();
        const genreAlbums = allAlbums.filter(
          album => album.genre && album.genre.toLowerCase() === genre.name.toLowerCase()
        );
        setAlbums(genreAlbums);
      } catch (error) {
        console.error('Error fetching data for genre:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [genre.name]);

  const handlePlaySong = (song) => {
    playSong(song, songs);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const renderSongItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handlePlaySong(item)}
    >
      <Text style={styles.songNumber}>{index + 1}.</Text>
      <Image source={{ uri: item.cover }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite(item);
        }}
        style={styles.favoriteButton}
      >
        <MaterialCommunityIcons
          name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorite(item.id) ? '#1DB954' : '#888'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => navigation.navigate('AlbumDetail', { album: item })}
    >
      <Image source={{ uri: item.cover }} style={styles.albumCover} />
      <Text style={styles.albumTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.albumArtist} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Genre</Text>
        </View>

        <View style={styles.genreHeader}>
          <View style={[styles.genreIconLarge, { backgroundColor: genre.color || '#1DB954' }]}>
            <MaterialCommunityIcons
              name={genre.icon || 'music'}
              size={64}
              color="#fff"
            />
          </View>
          <Text style={styles.genreTitleLarge}>{genre.name}</Text>
          {genre.description && (
            <Text style={styles.genreDescription}>{genre.description}</Text>
          )}
          <Text style={styles.genreMeta}>
            {albums.length} album{albums.length !== 1 ? 's' : ''} • {songs.length} song{songs.length !== 1 ? 's' : ''}
          </Text>

          {songs.length > 0 && (
            <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
              <MaterialCommunityIcons name="play" size={24} color="#fff" />
              <Text style={styles.playAllButtonText}>Play All</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Albums Section */}
            {albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Albums</Text>
                <FlatList
                  data={albums}
                  renderItem={renderAlbumItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.albumsList}
                />
              </View>
            )}

            {/* Songs Section */}
            {songs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Songs</Text>
                <FlatList
                  data={songs}
                  renderItem={renderSongItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  nestedScrollEnabled={false}
                />
              </View>
            )}

            {/* Empty State */}
            {albums.length === 0 && songs.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="music-off" size={64} color="#404040" />
                <Text style={styles.emptyText}>No content found in this genre.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 90, // Space for MiniPlayer
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  genreHeader: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  genreIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  genreTitleLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  genreDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  genreMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  playAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  albumsList: {
    paddingRight: 20,
  },
  albumItem: {
    width: 140,
    marginRight: 16,
  },
  albumCover: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  albumTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  albumArtist: {
    color: '#888',
    fontSize: 12,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  songNumber: {
    color: '#888',
    fontSize: 14,
    marginRight: 12,
    width: 20,
  },
  songCover: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  songArtist: {
    color: '#888',
    fontSize: 12,
  },
  songDuration: {
    color: '#888',
    fontSize: 12,
    marginRight: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
  },
});

export default GenreDetailScreen;

