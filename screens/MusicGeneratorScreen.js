import React, { useState, useContext } from "react"
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { MusicContext } from "../context/MusicContext"
import aiMusicService from "../services/aiMusicService"
import { songService } from "../services/songService"

const MusicGeneratorScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext)
  const { playSong } = useContext(MusicContext)

  // Form states
  const [description, setDescription] = useState("")

  // Generation states
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ step: 0, message: "" })
  const [generatedLyrics, setGeneratedLyrics] = useState("")
  const [generatedTitle, setGeneratedTitle] = useState("")
  const [showLyrics, setShowLyrics] = useState(false)

  const handleGenerate = async () => {
    // Validation
    if (!description.trim()) {
      Alert.alert("Error", "Please describe the music you want to create")
      return
    }
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to generate music")
      return
    }

    try {
      setGenerating(true)
      console.log("[AI][Generate] description=", description)
      setProgress({ step: 1, message: "Generating lyrics with Gemini..." })

      // Step 1-2: Generate lyrics and request MusicGPT job
      const { lyrics, requestResponse } = await aiMusicService.generateSongFlow(
        {
          description,
          prompt: description,
          music_style: "",
          make_instrumental: false,
          vocal_only: false,
        }
      )
      console.log("[AI][Lyrics] length=", (lyrics || "").length)
      console.log("[AI][MusicGPT][POST]/MusicAI response=", requestResponse)

      setGeneratedLyrics(lyrics || "")
      setProgress({ step: 3, message: "Submitting to MusicGPT..." })

      const taskId = requestResponse?.task_id
      const conv1 = requestResponse?.conversion_id_1
      const conv2 = requestResponse?.conversion_id_2

      if (!conv1 && !conv2) {
        console.warn(
          "[AI][MusicGPT] Missing conversion ids. Full response=",
          requestResponse
        )
        throw new Error("MusicGPT did not return conversion ids")
      }

      // Step 4-6: Poll GET /byId with task_id or conversion_id until COMPLETED
      let finalConversion = null
      setProgress({ step: 4, message: "Waiting for MusicGPT to finish..." })

      // Try polling with task_id first, then fallback to conversion_id_1, then conversion_id_2
      const pollCandidates = [
        { id: taskId, type: "task_id" },
        { id: conv1, type: "conversion_id" },
        { id: conv2, type: "conversion_id" },
      ].filter((c) => c.id)

      for (const candidate of pollCandidates) {
        console.log(
          "[AI][Poll] Start polling",
          candidate.type,
          "=",
          candidate.id
        )
        for (let i = 0; i < 60; i++) {
          // up to ~30 minutes with 30s interval
          try {
            const statusRes = await aiMusicService.getConversionById(
              candidate.id,
              candidate.type
            )
            const conv = statusRes?.conversion
            console.log("[AI][Poll] attempt", i + 1, "statusRes=", statusRes)

            if (conv?.status === "COMPLETED") {
              // Check if we have audio (conversion_path_1)
              if (conv?.conversion_path_1 || conv?.conversion_path_2) {
                finalConversion = conv
                console.log(
                  "[AI][Poll] COMPLETED",
                  candidate.type,
                  "=",
                  candidate.id,
                  "audio_path=",
                  conv.conversion_path_1 || conv.conversion_path_2
                )
                break
              }
            } else if (conv?.status) {
              console.log(
                "[AI][Poll] Status:",
                conv.status,
                "for",
                candidate.type,
                "=",
                candidate.id
              )
            }
          } catch (e) {
            const status = e.response?.status
            if (status === 422) {
              console.warn(
                "[AI][Poll] 422 error - invalid",
                candidate.type,
                "=",
                candidate.id,
                "trying next candidate"
              )
              break // Skip to next candidate
            } else {
              console.warn(
                "[AI][Poll] error on attempt",
                i + 1,
                "status=",
                status,
                e?.message
              )
            }
          }

          if (finalConversion) break

          // Wait before next attempt
          await new Promise((r) => setTimeout(r, 30000))
          setProgress({ step: 4, message: "Generating audio..." })
        }
        if (finalConversion) break
      }

      if (!finalConversion) {
        console.error(
          "[AI][Poll] Timeout. taskId=",
          taskId,
          "conv1=",
          conv1,
          "conv2=",
          conv2
        )
        throw new Error(`Music generation timed out (task: ${taskId || "n/a"})`)
      }

      // Build song data for Firestore - use correct fields from response
      const songData = {
        title:
          finalConversion.title_1 ||
          finalConversion.title_2 ||
          finalConversion.title ||
          "Generated Song",
        artist: user.displayName || "AI Artist",
        genre: finalConversion.music_style || "AI",
        duration: Math.round(
          finalConversion.conversion_duration_1 ||
            finalConversion.conversion_duration_2 ||
            0
        ),
        url:
          finalConversion.conversion_path_1 ||
          finalConversion.conversion_path_2 ||
          "", // MP3 file
        cover:
          finalConversion.album_cover_path ||
          finalConversion.album_cover_thumbnail ||
          "https://via.placeholder.com/400",
        lyrics:
          finalConversion.lyrics_1 ||
          finalConversion.lyrics_2 ||
          finalConversion.lyrics ||
          lyrics ||
          "",
        source: "MusicGPT",
        taskId: taskId || "",
        conversionId:
          finalConversion.conversion_id_1 ||
          finalConversion.conversion_id_2 ||
          conv1 ||
          conv2 ||
          "",
      }
      console.log("[AI][SongData] prepared for save=", songData)

      setGeneratedTitle(songData.title)

      setProgress({ step: 7, message: "Saving to database..." })
      const savedSong = await songService.createSong(songData, user.uid)
      console.log("[AI][Firestore] Saved successfully, songId=", savedSong.id)

      setGenerating(false)

      Alert.alert(
        "🎉 Success!",
        `"${songData.title}" has been created!\n\n` +
          `Artist: ${songData.artist}\n` +
          `Genre: ${songData.genre}`,
        [
          {
            text: "▶ Play Now",
            onPress: () => {
              // Play song using MusicContext - will appear in mini player
              playSong(savedSong, [savedSong])
            },
          },
          {
            text: "Go to Home",
            onPress: () => {
              // Reset form
              setDescription("")
              navigation.navigate("Home")
            },
          },
        ]
      )
    } catch (error) {
      console.error("Error generating music:", error)
      setGenerating(false)
      Alert.alert(
        "Error",
        error.message || "Failed to generate music. Please try again."
      )
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Music Generator</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="robot"
            size={24}
            color={COLORS.primary}
          />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerText}>AI-Powered Music Creation</Text>
          </View>
        </View>

        {!generating ? (
          <>
            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={24}
                color={COLORS.primary}
              />
              <View style={styles.instructionsContent}>
                <Text style={styles.instructionsTitle}>How it works:</Text>
                <Text style={styles.instructionsText}>
                  1. Describe your music{"\n"}
                  2. AI creates title, artist, genre{"\n"}
                  3. AI generates lyrics{"\n"}
                  4. AI creates music
                </Text>
              </View>
            </View>

            {/* Music Description */}
            <View style={styles.section}>
              <Text style={styles.label}>🎵 Describe Your Music</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  "Example descriptions:\n\n• 'Upbeat pop song about summer love with electric guitars and catchy chorus'\n\n• 'Calm piano ballad expressing deep sadness and longing'\n\n• 'Energetic EDM track for workout with heavy bass drops'\n\n• 'Acoustic folk song about traveling and freedom'"
                }
                placeholderTextColor="#666"
                multiline
                numberOfLines={10}
              />
              <Text style={styles.helperText}>
                ✨ Be specific about mood, instruments, tempo, and theme
              </Text>
            </View>

            {/* Duration removed */}

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}>
              <MaterialCommunityIcons
                name="robot"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.generateButtonText}>
                ✨ Generate AI Music
              </Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.infoBoxText}>
                Generation takes 3-5 minutes. AI will analyze your description,
                create title/artist/genre, generate lyrics and music.
              </Text>
            </View>
          </>
        ) : (
          // Generating UI
          <View style={styles.generatingContainer}>
            <MaterialCommunityIcons
              name="robot"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.generatingTitle}>Creating Your Music...</Text>

            {/* Progress Steps */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(progress.step / 7) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Step {progress.step} of 7: {progress.message}
              </Text>
            </View>

            {/* Loading animation */}
            <ActivityIndicator
              size="large"
              color="#8B5CF6"
              style={styles.loader}
            />

            <Text style={styles.generatingSubtext}>
              Please wait, this may take a minute...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Lyrics Modal */}
      <Modal
        visible={showLyrics}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLyrics(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generated Lyrics</Text>
              <TouchableOpacity onPress={() => setShowLyrics(false)}>
                <MaterialCommunityIcons
                  name="lightbulb-on"
                  size={24}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.lyricsScroll}>
              <Text style={styles.lyricsText}>{generatedLyrics}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLyrics(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const COLORS = {
  bg: "#1a1a1a",
  card: "#262626",
  text: "#ffffff",
  subtext: "#888888",
  border: "#404040",
  primary: "#1DB954",
  secondary: "#3ea6c1",
  accentBg: "rgba(29,185,84,0.10)",
  accentBorder: "rgba(29,185,84,0.35)",
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text },

  content: { flex: 1, paddingHorizontal: 20 },

  // Banner info dùng xanh lá nhạt
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentBg,
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  infoBannerContent: { marginLeft: 12, flex: 1 },
  infoBannerText: { color: COLORS.primary, fontSize: 16, fontWeight: "bold" },
  infoBannerSubtext: { color: COLORS.secondary, fontSize: 12, marginTop: 2 },

  // Hộp hướng dẫn: viền xanh lá, nền card
  instructionsBox: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  instructionsContent: { marginLeft: 12, flex: 1 },
  instructionsTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  instructionsText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },

  section: { marginBottom: 20 },
  label: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 180,
    textAlignVertical: "top",
    borderWidth: 2,
    borderColor: COLORS.primary, // viền xanh lá
  },
  helperText: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 8,
    fontWeight: "500",
  },

  // Nút generate xanh lá
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },

  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoBoxText: {
    color: COLORS.subtext,
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Đang tạo nhạc
  generatingContainer: { alignItems: "center", paddingVertical: 40 },
  generatingTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 32,
  },

  progressContainer: { width: "100%", marginBottom: 24 },
  progressBar: {
    height: 8,
    backgroundColor: "#262626",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },

  loader: { marginVertical: 20 },
  generatingSubtext: {
    color: COLORS.subtext,
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },

  // Modal lyrics
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  lyricsScroll: { padding: 20 },
  lyricsText: { color: COLORS.text, fontSize: 16, lineHeight: 28 },
  closeButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: { color: COLORS.text, fontSize: 16, fontWeight: "bold" },
})

export default MusicGeneratorScreen
