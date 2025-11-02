import React, { useContext, useEffect, useState } from "react"
import { View, StyleSheet, Image, TouchableOpacity, Text } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { MusicContext } from "../context/MusicContext"
import Slider from "@react-native-community/slider"

const PlayerScreen = () => {
  const {
    currentSong,
    isPlaying,
    duration,
    position,
    playSong,
    pauseSong,
    resumeSong,
    playNext,
    playPrevious,
    seek,
    isFavorite,
    toggleFavorite,
  } = useContext(MusicContext)

  const formatTime = (ms) => {
    if (!ms) return "0:00"
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContent}>
          <MaterialCommunityIcons name="music" size={80} color="#404040" />
          <Text style={styles.placeholderText}>No song playing</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Album Art */}
      <View style={styles.artworkContainer}>
        <Image source={{ uri: currentSong.cover }} style={styles.artwork} />
      </View>

      {/* Song Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.songTitle} numberOfLines={2}>
          {currentSong.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {currentSong.artist}
        </Text>
        <Text style={styles.albumName} numberOfLines={1}>
          {currentSong.album}
        </Text>
      </View>

      {/* Favorite Button */}
      <TouchableOpacity
        style={styles.favoriteContainer}
        onPress={() => toggleFavorite(currentSong)}>
        <MaterialCommunityIcons
          name={isFavorite(currentSong.id) ? "heart" : "heart-outline"}
          size={32}
          color={isFavorite(currentSong.id) ? "#FF6B6B" : "#888"}
        />
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          value={position}
          maximumValue={duration}
          onSlidingComplete={(value) => seek(value)}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#404040"
          thumbTintColor="#1DB954"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={playPrevious}>
          <MaterialCommunityIcons
            name="skip-previous"
            size={40}
            color="#1DB954"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? pauseSong : resumeSong}>
          <MaterialCommunityIcons
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={70}
            color="#1DB954"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={playNext}>
          <MaterialCommunityIcons name="skip-next" size={40} color="#1DB954" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="play" size={20} color="#888" />
          <Text style={styles.statText}>{currentSong.plays}</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="heart" size={20} color="#FF6B6B" />
          <Text style={styles.statText}>{currentSong.likes}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 16,
    marginTop: 16,
  },
  artworkContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  infoContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  artistName: {
    fontSize: 16,
    color: "#1DB954",
    marginBottom: 4,
  },
  albumName: {
    fontSize: 14,
    color: "#888",
  },
  favoriteContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  progressContainer: {
    marginVertical: 20,
  },
  slider: {
    height: 4,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "#888",
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
  },
  controlButton: {
    padding: 16,
  },
  playButton: {
    marginHorizontal: 32,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "#888",
    fontSize: 14,
  },
})

export default PlayerScreen
