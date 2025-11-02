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
  TextInput,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { MusicContext } from "../context/MusicContext"
import { songService } from "../services/songService"
import { albumService } from "../services/albumService"

const HomeScreen = ({ navigation }) => {
  const { playSong, isFavorite, toggleFavorite } = useContext(MusicContext)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [songs, setSongs] = useState([])
  const [albums, setAlbums] = useState([])
  const [filteredSongs, setFilteredSongs] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSongs(filtered)
    } else {
      setFilteredSongs(songs)
    }
  }, [searchQuery, songs])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load from Firestore
      const songsData = await songService.getAllSongs()
      const albumsData = await albumService.getAllAlbums()
      setSongs(songsData)
      setAlbums(albumsData)
      setFilteredSongs(songsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaySong = (song) => {
    playSong(song, songs)
  }

  const renderSongItem = ({ item }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handlePlaySong(item)}>
      <Image source={{ uri: item.cover }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => toggleFavorite(item)}
        style={styles.favoriteButton}>
        <MaterialCommunityIcons
          name={isFavorite(item.id) ? "heart" : "heart-outline"}
          size={24}
          color={isFavorite(item.id) ? "#1DB954" : "#888"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const renderAlbumItem = ({ item }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => navigation.navigate("AlbumDetail", { album: item })}>
      <Image source={{ uri: item.cover }} style={styles.albumCover} />
      <Text style={styles.albumTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.albumArtist} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZingMP3</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, artists..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Featured Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Albums</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Albums")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={albums.slice(0, 3)}
            renderItem={renderAlbumItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            ListEmptyComponent={
              loading ? null : (
                <Text style={styles.emptyText}>No albums available</Text>
              )
            }
          />
        </View>

        {/* Popular Songs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? "Search Results" : "Popular Songs"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity onPress={() => navigation.navigate("Songs")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>
          {loading ? (
            <ActivityIndicator color="#1DB954" size="large" />
          ) : (
            <FlatList
              data={filteredSongs}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 70, // Space for MiniPlayer
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: "#262626",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#404040",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  section: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  seeAll: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "600",
  },
  albumItem: {
    width: 140,
    marginRight: 12,
  },
  albumCover: {
    width: 140,
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },
  albumTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  albumArtist: {
    color: "#888",
    fontSize: 12,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
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
  favoriteButton: {
    padding: 8,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
})

export default HomeScreen
