import React, { useContext } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { MusicContext } from "../context/MusicContext"
import { AuthContext } from "../context/AuthContext"
import SongItem from "../components/SongItem"

const FavoritesScreen = () => {
  const { user } = useContext(AuthContext)
  const { favorites, loadingFavorites, playSong, loadFavorites } = useContext(MusicContext)
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await loadFavorites()
    setRefreshing(false)
  }, [loadFavorites])

  const renderSongItem = ({ item }) => (
    <SongItem 
      song={item} 
      onPress={() => playSong(item, favorites)} 
    />
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        {favorites.length > 0 && (
          <Text style={styles.count}>{favorites.length} songs</Text>
        )}
      </View>

      {!user ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-alert"
            size={64}
            color="#404040"
          />
          <Text style={styles.emptyText}>Login Required</Text>
          <Text style={styles.emptySubtext}>
            Please login to view and manage your favorite songs
          </Text>
        </View>
      ) : loadingFavorites && favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.emptyText}>Loading favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={64}
            color="#404040"
          />
          <Text style={styles.emptyText}>No favorite songs yet</Text>
          <Text style={styles.emptySubtext}>
            Add songs to your favorites by tapping the heart icon
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1DB954"
              colors={["#1DB954"]}
            />
          }
        />
      )}
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
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  count: {
    color: "#888",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 70, // Space for MiniPlayer
  },
})

export default FavoritesScreen
