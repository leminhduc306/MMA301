import React, { useContext } from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { MusicContext } from "../context/MusicContext"

const MiniPlayer = () => {
  const navigation = useNavigation()
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    playNext,
    toggleFavorite,
    isFavorite,
  } = useContext(MusicContext)

  if (!currentSong) {
    return null
  }

  const handlePress = () => {
    navigation.navigate("Player")
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Image source={{ uri: currentSong.cover }} style={styles.albumArt} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {currentSong.artist}
        </Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation()
            toggleFavorite(currentSong)
          }}
          style={styles.controlButton}>
          <MaterialCommunityIcons
            name={isFavorite(currentSong.id) ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite(currentSong.id) ? "#FF6B6B" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation()
            if (isPlaying) {
              pauseSong()
            } else {
              resumeSong()
            }
          }}
          style={styles.controlButton}>
          <MaterialCommunityIcons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color="#ccc"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation()
            playNext()
          }}
          style={styles.controlButton}>
          <MaterialCommunityIcons name="skip-next" size={22} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#262626",
    height: 80,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 13,
    color: "#ccc",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
})

export default MiniPlayer
