import React, { useState, useEffect, useContext } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import { AuthContext } from "../context/AuthContext"
import { songService } from "../services/songService"
import { albumService } from "../services/albumService"
import { genreService } from "../services/genreService"
import { userService } from "../services/userService"
import cloudinaryService from "../services/cloudinaryService"

const AdminScreen = ({ navigation }) => {
  const { user, userRole } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState("songs") // songs, albums, genres, users (for ADMIN only)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [songs, setSongs] = useState([])
  const [albums, setAlbums] = useState([])
  const [genres, setGenres] = useState([])
  const [users, setUsers] = useState([]) // For ADMIN only
  const [loadingList, setLoadingList] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Dropdown states
  const [showAlbumPicker, setShowAlbumPicker] = useState(false)
  const [showGenrePicker, setShowGenrePicker] = useState(false)
  const [showAlbumGenrePicker, setShowAlbumGenrePicker] = useState(false) // For album form

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)

  // Song Form State
  const [songForm, setSongForm] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    duration: "",
    url: "",
    cover: "",
  })

  // Local file URIs (trước khi upload)
  const [selectedAudioFile, setSelectedAudioFile] = useState(null)
  const [selectedCoverImage, setSelectedCoverImage] = useState(null)

  // Album Form State
  const [albumForm, setAlbumForm] = useState({
    title: "",
    artist: "",
    genre: "",
    year: "",
    cover: "",
    description: "",
  })

  // Album cover image
  const [selectedAlbumCover, setSelectedAlbumCover] = useState(null)

  // Genre Form State
  const [genreForm, setGenreForm] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [activeTab])

  useEffect(() => {
    // Debug: Check if user is loaded
    console.log("AdminScreen - User:", user)
    console.log("AdminScreen - User UID:", user?.uid)
    console.log("AdminScreen - User Role:", userRole)
  }, [user, userRole])

  const loadData = async () => {
    try {
      setLoadingList(true)

      if (activeTab === "songs") {
        // ADMIN sees all songs, USER sees only their own
        let songsData
        if (userRole === "ADMIN") {
          songsData = await songService.getAllSongs()
        } else if (user && user.uid) {
          songsData = await songService.getSongsByCreator(user.uid)
        } else {
          songsData = []
        }
        setSongs(songsData)

        // Also load albums and genres for dropdowns
        if (albums.length === 0) {
          const albumsData = await albumService.getAllAlbums()
          setAlbums(albumsData)
        }
        if (genres.length === 0) {
          const genresData = await genreService.getAllGenres()
          setGenres(genresData)
        }
      } else if (activeTab === "albums") {
        // ADMIN sees all albums, USER sees only their own
        let albumsData
        if (userRole === "ADMIN") {
          albumsData = await albumService.getAllAlbums()
        } else if (user && user.uid) {
          albumsData = await albumService.getAlbumsByCreator(user.uid)
        } else {
          albumsData = []
        }
        setAlbums(albumsData)

        // Also load genres for album form dropdown
        if (genres.length === 0) {
          const genresData = await genreService.getAllGenres()
          setGenres(genresData)
        }
      } else if (activeTab === "genres") {
        // ADMIN sees all genres, USER sees only their own
        let genresData
        if (userRole === "ADMIN") {
          genresData = await genreService.getAllGenres()
        } else if (user && user.uid) {
          genresData = await genreService.getGenresByCreator(user.uid)
        } else {
          genresData = []
        }
        setGenres(genresData)
      } else if (activeTab === "users" && userRole === "ADMIN") {
        // Only ADMIN can see users tab - fetch all users then filter
        const allUsersData = await userService.getAllUsers()
        // Filter to only show USER role (not ADMIN)
        const userRoleOnly = allUsersData.filter(
          (u) => u.role === "USER" || !u.role
        )
        setUsers(userRoleOnly)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to load data: " + error.message)
    } finally {
      setLoadingList(false)
    }
  }

  // Reset forms
  const resetForms = () => {
    setSongForm({
      title: "",
      artist: "",
      album: "",
      genre: "",
      duration: "",
      url: "",
      cover: "",
    })
    setAlbumForm({
      title: "",
      artist: "",
      genre: "",
      year: "",
      cover: "",
      description: "",
    })
    setGenreForm({
      name: "",
      description: "",
    })
    setSelectedAudioFile(null)
    setSelectedCoverImage(null)
    setSelectedAlbumCover(null)
    setIsEditMode(false)
    setEditingItemId(null)
  }

  // Handle edit item
  const handleEditItem = (item) => {
    setIsEditMode(true)
    setEditingItemId(item.id)
    setShowAddForm(true)

    if (activeTab === "songs") {
      setSongForm({
        title: item.title || "",
        artist: item.artist || "",
        album: item.album || "",
        genre: item.genre || "",
        duration: item.duration?.toString() || "",
        url: item.url || "",
        cover: item.cover || "",
      })
    } else if (activeTab === "albums") {
      setAlbumForm({
        title: item.title || "",
        artist: item.artist || "",
        genre: item.genre || "",
        year: item.year?.toString() || "",
        cover: item.cover || "",
        description: item.description || "",
      })
    } else if (activeTab === "genres") {
      setGenreForm({
        name: item.name || "",
        description: item.description || "",
      })
    }
  }

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0]
        setSelectedAudioFile(file)
        Alert.alert("Success", `Selected: ${file.name}`)
      }
    } catch (error) {
      console.error("Error picking audio:", error)
      Alert.alert("Error", "Failed to pick audio file")
    }
  }

  const pickCoverImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedCoverImage(result.assets[0])
        setSongForm({ ...songForm, cover: result.assets[0].uri })
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const pickAlbumCoverImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedAlbumCover(result.assets[0])
        setAlbumForm({ ...albumForm, cover: result.assets[0].uri })
      }
    } catch (error) {
      console.error("Error picking album cover:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const handleSaveSong = async () => {
    if (!songForm.title || !songForm.artist) {
      Alert.alert("Error", "Please fill in Title and Artist")
      return
    }

    // Check if user is logged in
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to create songs")
      return
    }

    // Cần file audio hoặc URL (chỉ khi CREATE, không cần khi EDIT)
    if (!isEditMode && !selectedAudioFile && !songForm.url) {
      Alert.alert("Error", "Please select an audio file or enter Song URL")
      return
    }

    try {
      setLoading(true)
      setIsUploading(true)

      let audioURL = songForm.url
      let coverURL = songForm.cover

      // Upload audio file lên Cloudinary nếu có
      if (selectedAudioFile) {
        setUploadProgress(0)
        console.log("Uploading audio to Cloudinary...")
        try {
          audioURL = await cloudinaryService.uploadWithProgress(
            selectedAudioFile.uri,
            "audio",
            "zingmp3/songs",
            (progress) => {
              setUploadProgress(progress)
              console.log(`Upload progress: ${progress}%`)
            }
          )
          console.log("Audio uploaded:", audioURL)
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError)
          Alert.alert(
            "Upload Error",
            'Failed to upload audio to Cloudinary. Please:\n\n1. Create upload preset "zingmp3_upload" (Unsigned)\n2. Or enter Song URL manually',
            [{ text: "OK" }]
          )
          return // Stop if upload fails
        }
      }

      // Upload cover image lên Cloudinary nếu có
      if (selectedCoverImage) {
        console.log("Uploading cover to Cloudinary...")
        try {
          coverURL = await cloudinaryService.uploadCoverImage(
            selectedCoverImage.uri,
            "song"
          )
          console.log("Cover uploaded:", coverURL)
        } catch (uploadError) {
          console.error("Cover upload error:", uploadError)
          // Cover is optional, continue without it
          coverURL = songForm.cover || "https://via.placeholder.com/400"
        }
      }

      // Create or Update song
      if (isEditMode && editingItemId) {
        // UPDATE
        await songService.updateSong(editingItemId, {
          ...songForm,
          url: audioURL,
          cover:
            coverURL || songForm.cover || "https://via.placeholder.com/400",
          duration: parseInt(songForm.duration) || 0,
        })
        Alert.alert("Success", "Song updated successfully! 🎵")
      } else {
        // CREATE - Pass userId to track creator
        await songService.createSong(
          {
            ...songForm,
            url: audioURL,
            cover: coverURL || "https://via.placeholder.com/400",
            duration: parseInt(songForm.duration) || 0,
            plays: 0,
            likes: 0,
          },
          user.uid
        )
        Alert.alert("Success", "Song added successfully! 🎵")
      }

      // Reset form
      resetForms()
      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error("Error adding song:", error)
      Alert.alert("Error", error.message || "Failed to add song")
    } finally {
      setLoading(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSaveAlbum = async () => {
    if (!albumForm.title || !albumForm.artist) {
      Alert.alert("Error", "Please fill in required fields")
      return
    }

    // Check if user is logged in
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to create albums")
      return
    }

    try {
      setLoading(true)
      setIsUploading(true)

      let coverURL = albumForm.cover

      // Upload cover image lên Cloudinary nếu có
      if (selectedAlbumCover) {
        setUploadProgress(0)
        console.log("Uploading album cover to Cloudinary...")
        try {
          coverURL = await cloudinaryService.uploadCoverImage(
            selectedAlbumCover.uri,
            "album"
          )
          console.log("Album cover uploaded:", coverURL)
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError)
          Alert.alert(
            "Upload Error",
            'Failed to upload image to Cloudinary. Please:\n\n1. Create upload preset "zingmp3_upload" (Unsigned)\n2. Or enter Image URL manually\n\nSee docs/CREATE_CLOUDINARY_PRESET.md',
            [{ text: "OK" }]
          )
          return // Stop if upload fails
        }
      }

      // Create or Update album
      if (isEditMode && editingItemId) {
        // UPDATE
        await albumService.updateAlbum(editingItemId, {
          ...albumForm,
          cover:
            coverURL || albumForm.cover || "https://via.placeholder.com/400",
          year: parseInt(albumForm.year) || new Date().getFullYear(),
        })
        Alert.alert("Success", "Album updated successfully! 🎼")
      } else {
        // CREATE - Pass userId to track creator
        await albumService.createAlbum(
          {
            ...albumForm,
            cover: coverURL || "https://via.placeholder.com/400",
            year: parseInt(albumForm.year) || new Date().getFullYear(),
            songs: [],
            totalDuration: 0,
            totalSongs: 0,
          },
          user.uid
        )
        Alert.alert("Success", "Album added successfully! 🎼")
      }

      resetForms()
      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error("Error adding album:", error)
      Alert.alert("Error", error.message || "Failed to add album")
    } finally {
      setLoading(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteSong = async (songId) => {
    Alert.alert("Delete Song", "Are you sure you want to delete this song?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await songService.deleteSong(songId)
            Alert.alert("Success", "Song deleted successfully")
            loadData()
          } catch (error) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  const handleDeleteAlbum = async (albumId) => {
    Alert.alert("Delete Album", "Are you sure you want to delete this album?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await albumService.deleteAlbum(albumId)
            Alert.alert("Success", "Album deleted successfully")
            loadData()
          } catch (error) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  // ============ GENRE CRUD FUNCTIONS ============

  const handleSaveGenre = async () => {
    if (!genreForm.name) {
      Alert.alert("Error", "Please fill in Genre Name")
      return
    }

    // Check if user is logged in
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to create genres")
      return
    }

    try {
      setLoading(true)

      // Create or Update genre
      if (isEditMode && editingItemId) {
        // UPDATE
        await genreService.updateGenre(editingItemId, {
          name: genreForm.name,
          description: genreForm.description || "",
        })
        Alert.alert("Success", "Genre updated successfully! 🎭")
      } else {
        // CREATE - Pass userId to track creator
        await genreService.createGenre(
          {
            name: genreForm.name,
            description: genreForm.description || "",
            icon: "music", // Default icon
            color: "#1DB954", // Default color
          },
          user.uid
        )
        Alert.alert("Success", "Genre added successfully! 🎭")
      }

      resetForms()
      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error("Error saving genre:", error)
      Alert.alert("Error", error.message || "Failed to save genre")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGenre = async (genreId) => {
    // Check if genre is being used
    const songsCount = await genreService.getSongsCountByGenre(genreId)

    if (songsCount > 0) {
      Alert.alert(
        "Cannot Delete",
        `This genre is used by ${songsCount} song(s). Please remove or reassign those songs first.`,
        [{ text: "OK" }]
      )
      return
    }

    Alert.alert("Delete Genre", "Are you sure you want to delete this genre?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await genreService.deleteGenre(genreId)
            Alert.alert("Success", "Genre deleted successfully")
            loadData()
          } catch (error) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  const renderSongItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleEditItem(item)}
      activeOpacity={0.7}>
      <Image
        source={{ uri: item.cover || "https://via.placeholder.com/50" }}
        style={styles.itemCover}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemSubtitle}>{item.artist}</Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={(e) => {
          e.stopPropagation()
          handleEditItem(item)
        }}>
        <MaterialCommunityIcons name="pencil" size={20} color="#1DB954" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation()
          handleDeleteSong(item.id)
        }}>
        <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const renderAlbumItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleEditItem(item)}
      activeOpacity={0.7}>
      <Image
        source={{ uri: item.cover || "https://via.placeholder.com/50" }}
        style={styles.itemCover}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemSubtitle}>
          {item.artist} • {item.year}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={(e) => {
          e.stopPropagation()
          handleEditItem(item)
        }}>
        <MaterialCommunityIcons name="pencil" size={20} color="#1DB954" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation()
          handleDeleteAlbum(item.id)
        }}>
        <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const renderGenreItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleEditItem(item)}
      activeOpacity={0.7}>
      <View
        style={[
          styles.genreIcon,
          { backgroundColor: item.color || "#1DB954" },
        ]}>
        <MaterialCommunityIcons
          name={item.icon || "music"}
          size={24}
          color="#fff"
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemSubtitle}>
          {item.description || "No description"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={(e) => {
          e.stopPropagation()
          handleEditItem(item)
        }}>
        <MaterialCommunityIcons name="pencil" size={20} color="#1DB954" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation()
          handleDeleteGenre(item.id)
        }}>
        <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  // User Management (ADMIN only)
  const renderUserItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.userAvatar}>
        <MaterialCommunityIcons name="account" size={32} color="#888" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.displayName || "Unknown User"}
        </Text>
        <Text style={styles.itemSubtitle}>{item.email}</Text>
        <Text
          style={[
            styles.roleTag,
            item.role === "ADMIN" ? styles.adminTag : styles.userTag,
          ]}>
          {item.role || "USER"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleToggleUserRole(item)}>
        <MaterialCommunityIcons name="account-cog" size={20} color="#1DB954" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteUser(item.id)}>
        <MaterialCommunityIcons name="delete" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  )

  const handleToggleUserRole = (userItem) => {
    // Only allow viewing USER accounts, no role changes
    Alert.alert(
      "User Information",
      `Name: ${userItem.displayName || "Unknown"}\nEmail: ${
        userItem.email
      }\nRole: ${
        userItem.role || "USER"
      }\n\nNote: Role management is restricted to protect system integrity.`,
      [{ text: "OK" }]
    )
  }

  const handleDeleteUser = (userId) => {
    Alert.alert("Delete User", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await userService.deleteUser(userId)
            Alert.alert("Success", "User deleted successfully")
            loadData()
          } catch (error) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userRole === "ADMIN" ? "Admin Panel" : "Upload Content"}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "songs" && styles.activeTab]}
          onPress={() => {
            setActiveTab("songs")
            setShowAddForm(false)
          }}>
          <MaterialCommunityIcons
            name="music"
            size={20}
            color={activeTab === "songs" ? "#1DB954" : "#888"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "songs" && styles.activeTabText,
            ]}>
            Songs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "albums" && styles.activeTab]}
          onPress={() => {
            setActiveTab("albums")
            setShowAddForm(false)
          }}>
          <MaterialCommunityIcons
            name="album"
            size={20}
            color={activeTab === "albums" ? "#1DB954" : "#888"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "albums" && styles.activeTabText,
            ]}>
            Albums
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "genres" && styles.activeTab]}
          onPress={() => {
            setActiveTab("genres")
            setShowAddForm(false)
          }}>
          <MaterialCommunityIcons
            name="apps"
            size={20}
            color={activeTab === "genres" ? "#1DB954" : "#888"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "genres" && styles.activeTabText,
            ]}>
            Genres
          </Text>
        </TouchableOpacity>

        {/* Users tab - Only for ADMIN */}
        {userRole === "ADMIN" && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "users" && styles.activeTab]}
            onPress={() => {
              setActiveTab("users")
              setShowAddForm(false)
            }}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={activeTab === "users" ? "#1DB954" : "#888"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "users" && styles.activeTabText,
              ]}>
              Users
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {!showAddForm ? (
          <>
            {/* Only show Add button if not on users tab */}
            {activeTab !== "users" && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  resetForms() // Reset trước khi mở form
                  setShowAddForm(true)
                }}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                <Text style={styles.addButtonText}>
                  Add{" "}
                  {activeTab === "songs"
                    ? "Song"
                    : activeTab === "albums"
                    ? "Album"
                    : "Genre"}
                </Text>
              </TouchableOpacity>
            )}

            {loadingList ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1DB954" />
              </View>
            ) : (
              <FlatList
                data={
                  activeTab === "songs"
                    ? songs
                    : activeTab === "albums"
                    ? albums
                    : activeTab === "genres"
                    ? genres
                    : activeTab === "users"
                    ? users
                    : []
                }
                renderItem={
                  activeTab === "songs"
                    ? renderSongItem
                    : activeTab === "albums"
                    ? renderAlbumItem
                    : activeTab === "genres"
                    ? renderGenreItem
                    : activeTab === "users"
                    ? renderUserItem
                    : null
                }
                keyExtractor={(item) => item.id}
                style={styles.list}
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
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name={
                        activeTab === "songs"
                          ? "music-off"
                          : activeTab === "albums"
                          ? "album"
                          : activeTab === "genres"
                          ? "apps"
                          : activeTab === "users"
                          ? "account-group"
                          : "help"
                      }
                      size={64}
                      color="#404040"
                    />
                    <Text style={styles.emptyText}>
                      No {activeTab} found
                      {activeTab !== "users" ? ". Add some!" : ""}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.formScroll}>
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isEditMode ? "Edit" : "Add"}{" "}
                  {activeTab === "songs"
                    ? "Song"
                    : activeTab === "albums"
                    ? "Album"
                    : "Genre"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    resetForms()
                    setShowAddForm(false)
                  }}>
                  <MaterialCommunityIcons name="close" size={24} color="#888" />
                </TouchableOpacity>
              </View>

              {activeTab === "songs" ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Song Title *"
                    placeholderTextColor="#666"
                    value={songForm.title}
                    onChangeText={(text) =>
                      setSongForm({ ...songForm, title: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Artist *"
                    placeholderTextColor="#666"
                    value={songForm.artist}
                    onChangeText={(text) =>
                      setSongForm({ ...songForm, artist: text })
                    }
                  />
                  {/* Album Picker */}
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowAlbumPicker(true)}>
                    <Text
                      style={[
                        styles.pickerText,
                        !songForm.album && styles.placeholderText,
                      ]}>
                      {songForm.album || "Select Album (Optional)"}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>

                  {/* Genre Picker */}
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowGenrePicker(true)}>
                    <Text
                      style={[
                        styles.pickerText,
                        !songForm.genre && styles.placeholderText,
                      ]}>
                      {songForm.genre || "Select Genre (Optional)"}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Duration (seconds)"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={songForm.duration}
                    onChangeText={(text) =>
                      setSongForm({ ...songForm, duration: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Song URL (or pick audio file below)"
                    placeholderTextColor="#666"
                    value={songForm.url}
                    onChangeText={(text) =>
                      setSongForm({ ...songForm, url: text })
                    }
                  />

                  {/* Audio File Picker - Upload to Cloudinary */}
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={pickAudioFile}>
                    <MaterialCommunityIcons
                      name="music-box"
                      size={20}
                      color="#1DB954"
                    />
                    <Text style={styles.filePickerText}>
                      {selectedAudioFile
                        ? `✓ ${selectedAudioFile.name}`
                        : "Pick Audio File (MP3)"}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.input}
                    placeholder="Cover Image URL (or pick image below)"
                    placeholderTextColor="#666"
                    value={songForm.cover}
                    onChangeText={(text) =>
                      setSongForm({ ...songForm, cover: text })
                    }
                  />

                  {/* Cover Image Picker - Upload to Cloudinary */}
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={pickCoverImage}>
                    <MaterialCommunityIcons
                      name="image"
                      size={20}
                      color="#1DB954"
                    />
                    <Text style={styles.filePickerText}>
                      {selectedCoverImage
                        ? "Image Selected ✓"
                        : "Pick Cover Image"}
                    </Text>
                  </TouchableOpacity>

                  {/* Upload Progress */}
                  {isUploading && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        Uploading to Cloudinary... {uploadProgress}%
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${uploadProgress}%` },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </>
              ) : activeTab === "albums" ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Album Title *"
                    placeholderTextColor="#666"
                    value={albumForm.title}
                    onChangeText={(text) =>
                      setAlbumForm({ ...albumForm, title: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Artist *"
                    placeholderTextColor="#666"
                    value={albumForm.artist}
                    onChangeText={(text) =>
                      setAlbumForm({ ...albumForm, artist: text })
                    }
                  />
                  {/* Genre Picker for Album */}
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowAlbumGenrePicker(true)}>
                    <Text
                      style={[
                        styles.pickerText,
                        !albumForm.genre && styles.placeholderText,
                      ]}>
                      {albumForm.genre || "Select Genre (Optional)"}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Year"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={albumForm.year}
                    onChangeText={(text) =>
                      setAlbumForm({ ...albumForm, year: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Cover Image URL (or pick image below)"
                    placeholderTextColor="#666"
                    value={albumForm.cover}
                    onChangeText={(text) =>
                      setAlbumForm({ ...albumForm, cover: text })
                    }
                  />

                  {/* Album Cover Image Picker - Upload to Cloudinary */}
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={pickAlbumCoverImage}>
                    <MaterialCommunityIcons
                      name="image"
                      size={20}
                      color="#1DB954"
                    />
                    <Text style={styles.filePickerText}>
                      {selectedAlbumCover
                        ? "Image Selected ✓"
                        : "Pick Album Cover"}
                    </Text>
                  </TouchableOpacity>

                  {/* Upload Progress */}
                  {isUploading && uploadProgress > 0 && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        Uploading to Cloudinary... {uploadProgress}%
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${uploadProgress}%` },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  <TextInput
                    style={styles.input}
                    placeholder="Description"
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    value={albumForm.description}
                    onChangeText={(text) =>
                      setAlbumForm({ ...albumForm, description: text })
                    }
                  />
                </>
              ) : activeTab === "genres" ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Genre Name *"
                    placeholderTextColor="#666"
                    value={genreForm.name}
                    onChangeText={(text) =>
                      setGenreForm({ ...genreForm, name: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Description"
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                    value={genreForm.description}
                    onChangeText={(text) =>
                      setGenreForm({ ...genreForm, description: text })
                    }
                  />
                  <Text style={styles.helperText}>
                    ℹ️ Default icon and color will be applied automatically
                  </Text>
                </>
              ) : null}

              {/* Submit Button */}

              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.6 }]}
                onPress={
                  activeTab === "songs"
                    ? handleSaveSong
                    : activeTab === "albums"
                    ? handleSaveAlbum
                    : handleSaveGenre
                }
                disabled={loading}>
                <Text style={styles.submitButtonText}>
                  {loading
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                    ? "Update"
                    : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Album Picker Modal */}
      <Modal
        visible={showAlbumPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlbumPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Album</Text>
              <TouchableOpacity onPress={() => setShowAlbumPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={albums}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSongForm({ ...songForm, album: item.title })
                    setShowAlbumPicker(false)
                  }}>
                  <Image
                    source={{ uri: item.cover }}
                    style={styles.modalItemImage}
                  />
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemTitle}>{item.title}</Text>
                    <Text style={styles.modalItemSubtitle}>{item.artist}</Text>
                  </View>
                  {songForm.album === item.title && (
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color="#1DB954"
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No albums available</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Genre Picker Modal */}
      <Modal
        visible={showGenrePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGenrePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Genre</Text>
              <TouchableOpacity onPress={() => setShowGenrePicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genres}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSongForm({ ...songForm, genre: item.name })
                    setShowGenrePicker(false)
                  }}>
                  <View
                    style={[
                      styles.genreIconSmall,
                      { backgroundColor: item.color || "#1DB954" },
                    ]}>
                    <MaterialCommunityIcons
                      name={item.icon || "music"}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalItemSubtitle} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {songForm.genre === item.name && (
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color="#1DB954"
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No genres available</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Album Genre Picker Modal */}
      <Modal
        visible={showAlbumGenrePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlbumGenrePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Genre for Album</Text>
              <TouchableOpacity onPress={() => setShowAlbumGenrePicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genres}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setAlbumForm({ ...albumForm, genre: item.name })
                    setShowAlbumGenrePicker(false)
                  }}>
                  <View
                    style={[
                      styles.genreIconSmall,
                      { backgroundColor: item.color || "#1DB954" },
                    ]}>
                    <MaterialCommunityIcons
                      name={item.icon || "music"}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalItemSubtitle} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {albumForm.genre === item.name && (
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color="#1DB954"
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No genres available</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
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
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#1DB954",
  },
  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#1DB954",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  itemCover: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemSubtitle: {
    color: "#888",
    fontSize: 12,
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginTop: 16,
  },
  formScroll: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 20,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    marginBottom: 12,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#1DB954",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#1DB954",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  filePickerText: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  progressText: {
    color: "#1DB954",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#404040",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: 3,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#4A90E2",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  testButtonText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "600",
  },
  helperText: {
    color: "#888",
    fontSize: 12,
    marginBottom: 12,
    marginTop: -8,
    fontStyle: "italic",
  },
  genreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  genreIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  pickerText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  placeholderText: {
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  modalItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalItemSubtitle: {
    color: "#888",
    fontSize: 12,
  },
  emptyModalText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#262626",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  adminTag: {
    backgroundColor: "#FF6B6B",
    color: "#fff",
  },
  userTag: {
    backgroundColor: "#1DB954",
    color: "#fff",
  },
})

export default AdminScreen
