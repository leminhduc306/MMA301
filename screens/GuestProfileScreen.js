import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"

const GuestProfileScreen = () => {
  const navigation = useNavigation()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 🎧</Text>
      <Text style={styles.subtitle}>
        Bạn đang dùng với tư cách khách. Bạn vẫn có thể nghe nhạc, tìm kiếm, xem
        album/genre và thêm Favorites (lưu cục bộ).
      </Text>

      <TouchableOpacity
        style={[styles.btn, styles.primary]}
        onPress={() => navigation.navigate("Login")}>
        <Text style={styles.btnText}>Đăng nhập</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.secondary]}
        onPress={() => navigation.navigate("Register")}>
        <Text style={styles.secondaryText}>Tạo tài khoản</Text>
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
