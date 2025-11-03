import React, { useState, useEffect, useContext, useMemo } from "react"
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
  ScrollView as HScrollView,
  RefreshControl,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { MusicContext } from "../context/MusicContext"
import { songService } from "../services/songService"
import { albumService } from "../services/albumService"
import { genreService } from "../services/genreService"
import SongItem from "../components/SongItem"
import { db } from "../firebase"

const HomeScreen = ({ navigation }) => {
  const { playSong, isFavorite, toggleFavorite } = useContext(MusicContext)

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [songs, setSongs] = useState([])
  const [albums, setAlbums] = useState([])
  const [genres, setGenres] = useState([])

  // HOT TODAY & Trending
  const [hotSong, setHotSong] = useState(null)
  const [selectedGenre, setSelectedGenre] = useState("All")

  // Search results
  const [filteredSongs, setFilteredSongs] = useState([])

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false)

  // Setup real-time listeners for songs and albums collections
  useEffect(() => {
    loadData()

    console.log('Setting up real-time listeners...')

    // Songs listener
    const unsubscribeSongs = db
      .collection('songs')
      .onSnapshot(
        (snapshot) => {
          const songsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))

          console.log(`Songs updated: ${songsData.length} songs`)
          setSongs(songsData)

          // Update Hot Today in real-time
          const pickHot = (list) => {
            if (!list || list.length === 0) return null
            return list.reduce((best, cur) => {
              const bLikes = Number(best.likes || 0)
              const cLikes = Number(cur.likes || 0)
              if (cLikes !== bLikes) return cLikes > bLikes ? cur : best
              const bPlays = Number(best.plays || 0)
              const cPlays = Number(cur.plays || 0)
              return cPlays > bPlays ? cur : best
            })
          }
          setHotSong(pickHot(songsData))

          // Update filtered songs if no search query
          if (!searchQuery) {
            setFilteredSongs(songsData)
          }
        },
        (error) => {
          console.error('Error in songs listener:', error)
        }
      )

    // Albums listener
    const unsubscribeAlbums = db
      .collection('albums')
      .onSnapshot(
        (snapshot) => {
          const albumsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))

          console.log(`Albums updated: ${albumsData.length} albums`)
          setAlbums(albumsData)
        },
        (error) => {
          console.error('Error in albums listener:', error)
        }
      )

    return () => {
      // Cleanup listeners
      console.log('Cleaning up real-time listeners')
      if (unsubscribeSongs) unsubscribeSongs()
      if (unsubscribeAlbums) unsubscribeAlbums()
    }
  }, [searchQuery])

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [songsData, albumsData, genresData] = await Promise.all([
        songService.getAllSongs(),
        albumService.getAllAlbums(),
        genreService.getAllGenres().catch(() => []), // an toàn nếu chưa có collection
      ])

      setSongs(songsData)
      setAlbums(albumsData)
      setGenres(genresData)

      // HOT TODAY: bài có likes cao nhất (fallback plays)
      const pickHot = (list) => {
        if (!list || list.length === 0) return null
        return list.reduce((best, cur) => {
          const bLikes = Number(best.likes || 0)
          const cLikes = Number(cur.likes || 0)
          if (cLikes !== bLikes) return cLikes > bLikes ? cur : best
          const bPlays = Number(best.plays || 0)
          const cPlays = Number(cur.plays || 0)
          return cPlays > bPlays ? cur : best
        })
      }
      setHotSong(pickHot(songsData))

      setFilteredSongs(songsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Search behavior
  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const filtered = songs.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.artist?.toLowerCase().includes(q)
      )
      setFilteredSongs(filtered)
    } else {
      setFilteredSongs(songs)
    }
  }, [searchQuery, songs])

  // Trending list (memo) – lọc theo selectedGenre, sort by likes -> plays
  const trendingSongs = useMemo(() => {
    const base =
      selectedGenre === "All"
        ? songs
        : songs.filter(
          (s) =>
            s.genre && s.genre.toLowerCase() === selectedGenre.toLowerCase()
        )
    const sorted = [...base].sort((a, b) => {
      const la = Number(a.likes || 0)
      const lb = Number(b.likes || 0)
      if (lb !== la) return lb - la
      const pa = Number(a.plays || 0)
      const pb = Number(b.plays || 0)
      return pb - pa
    })
    return sorted.slice(0, 20) // giới hạn
  }, [songs, selectedGenre])

  const handlePlaySong = (song, list = songs) => {
    playSong(song, list)
  }

  const renderSongItem = ({ item }) => (
    <SongItem
      song={item}
      onPress={() => handlePlaySong(item, trendingSongs)}
    />
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DB954"
            colors={["#1DB954"]}
            title="Loading..."
            titleColor="#888"
          />
        }
      >
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

        {/* HOT TODAY */}
        {!loading && hotSong && !searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hot Today</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.hotCard}
              onPress={() => handlePlaySong(hotSong, songs)}>
              <Image source={{ uri: hotSong.cover }} style={styles.hotImage} />
              <View style={styles.hotOverlay} />
              <View style={styles.hotMeta}>
                <View style={styles.hotRow}>
                  <MaterialCommunityIcons
                    name="fire"
                    size={20}
                    color="#1DB954"
                  />
                  <Text style={styles.hotBadge}>Most liked</Text>
                </View>
                <Text style={styles.hotTitle} numberOfLines={1}>
                  {hotSong.title}
                </Text>
                <Text style={styles.hotArtist} numberOfLines={1}>
                  {hotSong.artist}
                </Text>

                <View style={styles.hotStats}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons
                      name="heart"
                      size={16}
                      color="#FF6B6B"
                    />
                    <Text style={styles.statText}>
                      {Number(hotSong.likes || 0)}
                    </Text>
                  </View>
                  <View style={styles.dot} />
                  <View style={styles.stat}>
                    <MaterialCommunityIcons
                      name="play"
                      size={16}
                      color="#9CA3AF"
                    />
                    <Text style={styles.statText}>
                      {Number(hotSong.plays || 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.hotActions}>
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => handlePlaySong(hotSong, songs)}>
                    <MaterialCommunityIcons
                      name="play"
                      size={22}
                      color="#1A1A1A"
                    />
                    <Text style={styles.playBtnText}>Play</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.queueBtn}
                    onPress={() =>
                      handlePlaySong(hotSong, [hotSong, ...songs])
                    }>
                    <MaterialCommunityIcons
                      name="playlist-plus"
                      size={20}
                      color="#1DB954"
                    />
                    <Text style={styles.queueBtnText}>Queue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* TRENDING (filter by genre) */}
        {!searchQuery && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
            </View>

            {/* Genre chips */}
            <HScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {["All", ...genres.map((g) => g.name)].map((g) => {
                const active = selectedGenre === g
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.chip,
                      active ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() => setSelectedGenre(g)}>
                    <Text
                      style={[
                        styles.chipText,
                        active
                          ? styles.chipTextActive
                          : styles.chipTextInactive,
                      ]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </HScrollView>

            {loading ? (
              <ActivityIndicator color="#1DB954" size="large" />
            ) : trendingSongs.length === 0 ? (
              <Text style={styles.emptyText}>No trending songs</Text>
            ) : (
              <FlatList
                data={trendingSongs}
                renderItem={renderSongItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                nestedScrollEnabled={false}
              />
            )}
          </View>
        )}

        {/* New Albums (giữ lại, sau Trending) */}
        {!searchQuery && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Albums</Text>

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
        )}

        {/* Search results (nếu có query) */}
        {searchQuery ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search Results</Text>
            </View>
            {loading ? (
              <ActivityIndicator color="#1DB954" size="large" />
            ) : filteredSongs.length === 0 ? (
              <Text style={styles.emptyText}>No results</Text>
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
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#fff" },

  content: { flex: 1 },
  contentContainer: { paddingBottom: 70 },

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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: "#fff", fontSize: 14 },

  section: { marginVertical: 20, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  seeAll: { color: "#1DB954", fontSize: 14, fontWeight: "600" },

  // HOT TODAY
  hotCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#262626",
  },
  hotImage: {
    width: "100%",
    height: 200,
  },
  hotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  hotMeta: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
  },
  hotRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  hotBadge: {
    color: "#1DB954",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  hotTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  hotArtist: { color: "#9CA3AF", marginTop: 2 },
  hotStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { color: "#9CA3AF", fontSize: 12 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9CA3AF",
    marginHorizontal: 8,
  },
  hotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1DB954",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  playBtnText: { color: "#1A1A1A", fontWeight: "700" },
  queueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(29,185,84,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1DB954",
  },
  queueBtnText: { color: "#1DB954", fontWeight: "700" },

  // Genre chips
  chipsRow: { paddingVertical: 6, paddingRight: 10 },
  chip: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chipActive: { backgroundColor: "#1DB954", borderColor: "#1DB954" },
  chipInactive: { backgroundColor: "transparent", borderColor: "#404040" },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#1A1A1A" },
  chipTextInactive: { color: "#9CA3AF" },

  // Lists
  albumItem: { width: 140, marginRight: 12 },
  albumCover: { width: 140, height: 140, borderRadius: 10, marginBottom: 8 },
  albumTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  albumArtist: { color: "#888", fontSize: 12 },

  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  songCover: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  songInfo: { flex: 1 },
  songTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  songArtist: { color: "#888", fontSize: 12, marginBottom: 4 },
  songStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#888",
    fontSize: 11,
  },
  favoriteButton: { padding: 8 },

  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
})

export default HomeScreen
