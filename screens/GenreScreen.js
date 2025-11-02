import React, { useState, useEffect } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { genreService } from "../services/genreService"

const GenreScreen = ({ navigation }) => {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGenres()
  }, [])

  const loadGenres = async () => {
    try {
      setLoading(true)
      const genresData = await genreService.getAllGenres()
      setGenres(genresData)
    } catch (error) {
      console.error("Error loading genres:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderGenreItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.genreItem, { backgroundColor: item.color || "#1DB954" }]}
      onPress={() => navigation.navigate("GenreDetail", { genre: item })}>
      <View style={styles.genreContent}>
        <MaterialCommunityIcons
          name={item.icon || "music"}
          size={32}
          color="#fff"
        />
        <Text style={styles.genreName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.genreDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Genres</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={genres}
          renderItem={renderGenreItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="music-off"
                size={64}
                color="#404040"
              />
              <Text style={styles.emptyText}>No genres available</Text>
            </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    paddingBottom: 70, // Space for MiniPlayer
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginBottom: 12,
  },
  genreItem: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  genreContent: {
    alignItems: "center",
  },
  genreName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  genreDescription: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginTop: 16,
  },
})

export default GenreScreen
