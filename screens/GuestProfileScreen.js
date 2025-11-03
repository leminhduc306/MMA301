import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"

const GuestProfileScreen = () => {
  const navigation = useNavigation()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 🎧</Text>
      <Text style={styles.subtitle}>
        You are using as a guest. You can still listen to music, search, browse
        albums/genres and add Favorites (stored locally).
      </Text>

      <TouchableOpacity
        style={[styles.btn, styles.primary]}
        onPress={() => navigation.navigate("Login")}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.secondary]}
        onPress={() => navigation.navigate("Register")}>
        <Text style={styles.secondaryText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primary: { backgroundColor: "#1DB954" },
  secondary: { borderWidth: 1, borderColor: "#404040" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
})

export default GuestProfileScreen
