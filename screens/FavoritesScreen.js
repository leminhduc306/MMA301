import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  useCallback,
} from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import firebase from "firebase/compat/app"
import { db } from "../firebase"
import { MusicContext } from "../context/MusicContext"
import SongItem from "../components/SongItem"

const BRAND = {
  primary: "#1DB954",
  secondary: "#3ea6c1",
  bg: "#0f0f0f",
  card: "#1a1a1a",
  border: "#262626",
  text: "#fff",
  mut: "#9ca3af",
}

const chunk = (arr, size = 10) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function FavoritesScreen() {
  const {
    favorites: favoriteIds,
    isFavorite,
    toggleFavorite,
    playSong,
  } = useContext(MusicContext)

  const [favSongs, setFavSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sort, setSort] = useState("recent") // recent | plays | likes

  const loadSongs = useCallback(async () => {
    setLoading(true)
    try {
      if (!favoriteIds?.length) {
        setFavSongs([])
        return
      }
      const chunks = chunk(favoriteIds, 10)
      const qs = await Promise.all(
        chunks.map((ids) =>
          db
            .collection("songs")
            .where(firebase.firestore.FieldPath.documentId(), "in", ids)
            .get()
        )
      )
      const merged = qs.flatMap((s) =>
        s.docs.map((d) => ({ id: d.id, ...d.data() }))
      )

      // giữ thứ tự theo favoriteIds mặc định
      const map = new Map(merged.map((s) => [s.id, s]))
      const ordered = favoriteIds.map((id) => map.get(id)).filter(Boolean)
      setFavSongs(ordered)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [favoriteIds])

  useEffect(() => {
    loadSongs()
  }, [loadSongs])

  const totals = useMemo(
    () => ({
      plays: favSongs.reduce((a, b) => a + (b?.plays || 0), 0),
      likes: favSongs.reduce((a, b) => a + (b?.likes || 0), 0),
    }),
    [favSongs]
  )

  const sorted = useMemo(() => {
    const arr = [...favSongs]
    if (sort === "plays") arr.sort((a, b) => (b?.plays || 0) - (a?.plays || 0))
    else if (sort === "likes")
      arr.sort((a, b) => (b?.likes || 0) - (a?.likes || 0))
    else {
      // recent: fallback createdAt/updatedAt/likes
      arr.sort((a, b) => {
        const aTs =
          (a?.updatedAt?.toMillis?.() ??
            new Date(a?.updatedAt || a?.createdAt || 0).getTime()) ||
          0
        const bTs =
          (b?.updatedAt?.toMillis?.() ??
            new Date(b?.updatedAt || b?.createdAt || 0).getTime()) ||
          0
        return bTs - aTs
      })
    }
    return arr
  }, [favSongs, sort])

  const Header = () => (
    <View>
      <LinearGradient
        colors={[BRAND.primary, BRAND.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: 28,
          paddingBottom: 24,
          borderRadius: 16,
          marginTop: 10,
        }}>
        <Text style={{ color: BRAND.text, fontSize: 34, fontWeight: "800" }}>
          My Favorites
        </Text>
        <Text style={{ color: "#e5e7eb", marginTop: 6 }}>
          {favSongs.length} {favSongs.length === 1 ? "song" : "songs"}
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 16, marginTop: 14 }}>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
            }}>
            <MaterialCommunityIcons name="play" size={16} color={BRAND.text} />
            <Text
              style={{ color: BRAND.text, marginLeft: 6, fontWeight: "600" }}>
              {totals.plays}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
            }}>
            <MaterialCommunityIcons name="heart" size={16} color={BRAND.text} />
            <Text
              style={{ color: BRAND.text, marginLeft: 6, fontWeight: "600" }}>
              {totals.likes}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sort pills */}
      <View
        style={{
          paddingHorizontal: 0,
          paddingTop: 12,
          paddingBottom: 8,
          flexDirection: "row",
          gap: 8,
        }}>
        {[
          { key: "recent", label: "Recent", icon: "clock-outline" },
          { key: "plays", label: "Most Played", icon: "play" },
          { key: "likes", label: "Most Liked", icon: "heart-outline" },
        ].map((opt) => {
          const active = sort === opt.key
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: active ? "rgba(29,185,84,0.15)" : BRAND.card,
                borderWidth: 1,
                borderColor: active ? BRAND.primary : BRAND.border,
              }}>
              <MaterialCommunityIcons
                name={opt.icon}
                size={16}
                color={active ? BRAND.primary : BRAND.mut}
              />
              <Text
                style={{
                  color: active ? BRAND.primary : BRAND.mut,
                  marginLeft: 6,
                  fontWeight: active ? "700" : "500",
                }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  const Empty = () => (
    <View style={{ padding: 32, alignItems: "center" }}>
      <View
        style={{
          backgroundColor: BRAND.card,
          padding: 16,
          borderRadius: 16,
          borderColor: BRAND.border,
          borderWidth: 1,
        }}>
        <MaterialCommunityIcons
          name="heart-outline"
          size={36}
          color={BRAND.mut}
        />
      </View>
      <Text
        style={{
          color: BRAND.text,
          fontSize: 18,
          fontWeight: "700",
          marginTop: 16,
        }}>
        No favorites yet
      </Text>
      <Text style={{ color: BRAND.mut, marginTop: 6, textAlign: "center" }}>
        Tap the heart icon on a song to add it to your favorites.
      </Text>
    </View>
  )

  if (loading && !refreshing && favSongs.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BRAND.bg,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={!loading ? <Empty /> : null}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            tintColor={BRAND.primary}
            colors={[BRAND.primary]}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadSongs()
            }}
          />
        }
        renderItem={({ item }) => (
          <SongItem
            song={item}
            isFavorite={isFavorite(item?.id)}
            onToggleFavorite={() => toggleFavorite(item)}
            onPress={() => playSong(item, sorted)}
          />
        )}
      />
    </View>
  )
}
