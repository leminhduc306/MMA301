import React, { useState, useEffect, useContext } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { MusicContext } from "../context/MusicContext"
import { songService } from "../services/songService"

const AlbumDetailScreen = ({ route, navigation }) => {
  const { album } = route.params
  const { playSong, isFavorite, toggleFavorite } = useContext(MusicContext)
  const [loading, setLoading] = useState(true)
  const [songs, setSongs] = useState([])

  useEffect(() => {
    loadAlbumSongs()
  }, [album.id])

  const loadAlbumSongs = async () => {
    try {
      setLoading(true)
      // Get all songs and filter by album
      const allSongs = await songService.getAllSongs()
      const albumSongs = allSongs.filter(
        (song) => song.album === album.title || song.albumId === album.id
      )
      setSongs(albumSongs)
    } catch (error) {
      console.error("Error loading album songs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaySong = (song) => {
    playSong(song, songs)
  }

  const renderSongItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handlePlaySong(item)}>
      <Text style={styles.songNumber}>{index + 1}</Text>
      <Image source={{ uri: item.cover }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <Text style={styles.songDuration}>
        {Math.floor(item.duration / 60)}:
        {String(item.duration % 60).padStart(2, "0")}
      </Text>
      <TouchableOpacity
        onPress={() => toggleFavorite(item)}
        style={styles.favoriteButton}>
        <MaterialCommunityIcons
          name={isFavorite(item.id) ? "heart" : "heart-outline"}
          size={24}
          color={isFavorite(item.id) ? "#FF6B6B" : "#888"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Album</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Album Info */}
        <View style={styles.albumHeader}>
          <Image source={{ uri: album.cover }} style={styles.albumCover} />
          <Text style={styles.albumTitle}>{album.title}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
          <View style={styles.albumStats}>
            <Text style={styles.albumYear}>{album.year}</Text>
            <Text style={styles.albumDot}>•</Text>
            <Text style={styles.albumSongCount}>
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </Text>
          </View>
          {album.description && (
            <Text style={styles.albumDescription}>{album.description}</Text>
          )}
        </View>

        {/* Play All Button */}
        {songs.length > 0 && (
          <TouchableOpacity
            style={styles.playAllButton}
            onPress={() => handlePlaySong(songs[0])}>
            <MaterialCommunityIcons name="play-circle" size={28} color="#fff" />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        )}

        {/* Songs List */}
        <View style={styles.songsSection}>
          <Text style={styles.songsTitle}>Songs</Text>
          {loading ? (
            <ActivityIndicator
              color="#1DB954"
              size="large"
              style={{ marginTop: 20 }}
            />
          ) : songs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="music-off"
                size={64}
                color="#404040"
              />
              <Text style={styles.emptyText}>No songs in this album</Text>
            </View>
          ) : (
            <FlatList
              data={songs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 70,
  },
  albumHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  albumCover: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  albumArtist: {
    fontSize: 16,
    color: "#1DB954",
    marginBottom: 12,
  },
  albumStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  albumYear: {
    color: "#888",
    fontSize: 14,
  },
  albumDot: {
    color: "#888",
    marginHorizontal: 8,
  },
  albumSongCount: {
    color: "#888",
    fontSize: 14,
  },
  albumDescription: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DB954",
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  playAllText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  songsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  songsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  songNumber: {
    color: "#888",
    fontSize: 14,
    width: 30,
    textAlign: "center",
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  songArtist: {
    color: "#888",
    fontSize: 12,
  },
  songDuration: {
    color: "#888",
    fontSize: 12,
    marginRight: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginTop: 16,
  },
})

export default AlbumDetailScreen
