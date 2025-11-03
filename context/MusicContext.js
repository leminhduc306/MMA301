// context/MusicContext.js
import React, {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
} from "react"
import { Audio } from "expo-av"
import firebase from "firebase/compat/app"
import { db } from "../firebase"
import { AuthContext } from "../context/AuthContext"

export const MusicContext = createContext()

export const MusicProvider = ({ children }) => {
  const { user } = useContext(AuthContext)

  // 1 Sound duy nhất
  const soundRef = useRef(new Audio.Sound())
  const loadingRef = useRef(false)
  const lastCountedIdRef = useRef(null)
  const favUnsubRef = useRef(null)

  const [currentSong, setCurrentSong] = useState(null)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)

  // ===== Favorites (theo ID) =====
  const [favoriteIds, setFavoriteIds] = useState([]) // ['songId1', 'songId2', ...]
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  useEffect(() => {
    // cấu hình audio
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    })

    return () => {
      try {
        soundRef.current.unloadAsync()
      } catch {}
      if (favUnsubRef.current) {
        favUnsubRef.current()
        favUnsubRef.current = null
      }
    }
  }, [])

  // Subscribe favorites theo user (đang dùng subcollection users/{uid}/favorites)
  useEffect(() => {
    // clear trước
    if (favUnsubRef.current) {
      favUnsubRef.current()
      favUnsubRef.current = null
    }
    if (!user?.uid) {
      setFavoriteIds([])
      return
    }

    setLoadingFavorites(true)
    const ref = db.collection("users").doc(user.uid).collection("favorites")
    favUnsubRef.current = ref.onSnapshot(
      (snap) => {
        // mỗi doc có id là songId (vì toggleFavorite dùng .doc(song.id))
        const ids = snap.docs
          .map((d) => d.id || d.data()?.songId)
          .filter(Boolean)
        setFavoriteIds(ids)
        setLoadingFavorites(false)
      },
      (err) => {
        console.warn("favorites subscribe error:", err?.message)
        setLoadingFavorites(false)
      }
    )

    return () => {
      if (favUnsubRef.current) {
        favUnsubRef.current()
        favUnsubRef.current = null
      }
    }
  }, [user?.uid])

  const attachStatus = () => {
    soundRef.current.setOnPlaybackStatusUpdate((status) => {
      if (!status?.isLoaded) return
      setDuration(status.durationMillis ?? 0)
      setPosition(status.positionMillis ?? 0)
      setIsPlaying(Boolean(status.isPlaying))
      if (status.didJustFinish) {
        playNext()
      }
    })
  }

  const loadAndPlay = async (song) => {
    if (!song?.url) return
    if (loadingRef.current) return
    loadingRef.current = true
    const s = soundRef.current

    try {
      try {
        await s.stopAsync()
      } catch {}
      try {
        await s.unloadAsync()
      } catch {}
      await s.loadAsync({ uri: song.url }, { shouldPlay: true }, true)
      attachStatus()
      setIsPlaying(true)

      // tăng plays 1 lần / mỗi song id
      if (song.id && lastCountedIdRef.current !== song.id) {
        try {
          await db
            .collection("songs")
            .doc(song.id)
            .update({
              plays: firebase.firestore.FieldValue.increment(1),
            })
          lastCountedIdRef.current = song.id
        } catch (e) {
          console.warn("Increment plays failed:", e?.message)
        }
      }
    } finally {
      loadingRef.current = false
    }
  }

  const playSong = useCallback(
    async (song, songList = []) => {
      await loadAndPlay(song)
      setCurrentSong(song)

      if (songList.length) {
        setPlaylist(songList)
        const idx = songList.findIndex((x) => x.id === song.id)
        setCurrentIndex(idx >= 0 ? idx : 0)
      } else if (playlist.length) {
        const idx = playlist.findIndex((x) => x.id === song.id)
        setCurrentIndex(idx >= 0 ? idx : 0)
      } else {
        setPlaylist([song])
        setCurrentIndex(0)
      }
    },
    [playlist]
  )

  const pauseSong = useCallback(async () => {
    try {
      await soundRef.current.pauseAsync()
    } catch {}
    setIsPlaying(false)
  }, [])

  const resumeSong = useCallback(async () => {
    try {
      await soundRef.current.playAsync()
    } catch {}
    setIsPlaying(true)
  }, [])

  const playNext = useCallback(async () => {
    if (!playlist.length) return
    const next = (currentIndex + 1) % playlist.length
    const song = playlist[next]
    await loadAndPlay(song)
    setCurrentSong(song)
    setCurrentIndex(next)
  }, [playlist, currentIndex])

  const playPrevious = useCallback(async () => {
    if (!playlist.length) return
    const prev = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    const song = playlist[prev]
    await loadAndPlay(song)
    setCurrentSong(song)
    setCurrentIndex(prev)
  }, [playlist, currentIndex])

  const seek = useCallback(async (posMs) => {
    try {
      await soundRef.current.setPositionAsync(posMs)
    } catch {}
    setPosition(posMs)
  }, [])

  // ======= NEW: helper kiểm tra yêu thích =======
  const isFavorite = useCallback(
    (songId) => favoriteIds.includes(songId),
    [favoriteIds]
  )

  // ======= Toggle favorite (dùng subcollection users/{uid}/favorites) =======
  const toggleFavorite = useCallback(
    async (song) => {
      if (!song?.id) return

      // Nếu chưa đăng nhập: chỉ cập nhật UI local
      if (!user?.uid) {
        setFavoriteIds((prev) =>
          prev.includes(song.id)
            ? prev.filter((id) => id !== song.id)
            : [...prev, song.id]
        )
        return
      }

      const favRef = db
        .collection("users")
        .doc(user.uid)
        .collection("favorites")
        .doc(song.id)
      const songRef = db.collection("songs").doc(song.id)

      await db.runTransaction(async (tx) => {
        const favSnap = await tx.get(favRef)
        if (favSnap.exists) {
          // Unfavorite
          tx.delete(favRef)
          tx.update(songRef, {
            likes: firebase.firestore.FieldValue.increment(-1),
          })
          setFavoriteIds((prev) => prev.filter((id) => id !== song.id))
        } else {
          // Favorite
          tx.set(favRef, { addedAt: new Date(), songId: song.id })
          tx.update(songRef, {
            likes: firebase.firestore.FieldValue.increment(1),
          })
          setFavoriteIds((prev) =>
            prev.includes(song.id) ? prev : [...prev, song.id]
          )
        }
      })
    },
    [user]
  )

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        duration,
        position,
        playlist,
        playSong,
        pauseSong,
        resumeSong,
        playNext,
        playPrevious,
        seek,

        // Favorites API
        favorites: favoriteIds, // array<string>
        isFavorite, // (songId) => boolean   <-- đã KHAI BÁO
        toggleFavorite,
        loadingFavorites,
        loadFavorites: async () => {}, // giữ để không breaking, subscription đã auto
      }}>
      {children}
    </MusicContext.Provider>
  )
}
