import React, { useContext, useEffect } from "react"
import { ActivityIndicator, View, TouchableOpacity, Text } from "react-native"
import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { StatusBar as RNStatusBar, Platform } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

import { AuthProvider, AuthContext } from "./context/AuthContext"
import { MusicProvider } from "./context/MusicContext"

// Auth Screens
import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"

// App Screens
import HomeScreen from "./screens/HomeScreen"
import PlayerScreen from "./screens/PlayerScreen"
import FavoritesScreen from "./screens/FavoritesScreen"
import GenreScreen from "./screens/GenreScreen"
import ProfileScreen from "./screens/ProfileScreen"
import AdminScreen from "./screens/AdminScreen"
import AlbumDetailScreen from "./screens/AlbumDetailScreen"
import GenreDetailScreen from "./screens/GenreDetailScreen"
import GuestProfileScreen from "./screens/GuestProfileScreen"
import MusicGeneratorScreen from "./screens/MusicGeneratorScreen"

// Components
import MiniPlayer from "./components/MiniPlayer"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  )
}

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="GenreDetail" component={GenreDetailScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
      <Stack.Screen name="Albums" component={HomeScreen} />
      <Stack.Screen name="Songs" component={HomeScreen} />
      <Stack.Screen name="SongsByGenre" component={HomeScreen} />
    </Stack.Navigator>
  )
}

const GenreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="GenreMain" component={GenreScreen} />
      <Stack.Screen name="GenreDetail" component={GenreDetailScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  )
}

const FavoritesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  )
}

const ProfileStack = () => {
  const { user } = useContext(AuthContext)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProfileMain"
        component={user ? ProfileScreen : GuestProfileScreen}
      />
    </Stack.Navigator>
  )
}

const AdminStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="AdminMain" component={AdminScreen} />
    </Stack.Navigator>
  )
}

const AIStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="AIMain" component={MusicGeneratorScreen} />
    </Stack.Navigator>
  )
}

const AppTabs = () => {
  const { user, userRole } = useContext(AuthContext)

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => {
          const getActiveRouteName = (route) => {
            let r = route
            // React Navigation v5/v6: state có thể nằm ở route.state hoặc route?.state?.routes...
            while (r?.state && typeof r.state.index === "number") {
              r = r.state.routes[r.state.index]
            }
            return r?.name
          }

          const currentTopRoute = props.state.routes[props.state.index]
          const activeRouteName = getActiveRouteName(currentTopRoute)
          const onPlayerScreen = activeRouteName === "Player"
          return (
            <View>
              {/* MiniPlayer - Show for non-admin or when not logged in */}
              {userRole !== "ADMIN" && !onPlayerScreen && <MiniPlayer />}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#1a1a1a",
                  borderTopColor: "#262626",
                  borderTopWidth: 1,
                  paddingVertical: 20,
                  paddingTop: 8,
                  height: 80,
                }}>
                {props.state.routes.map((route, index) => {
                  const { options } = props.descriptors[route.key]
                  const label =
                    options.tabBarLabel !== undefined
                      ? options.tabBarLabel
                      : options.title !== undefined
                      ? options.title
                      : route.name
                  const isFocused = props.state.index === index
                  const IconComponent = options.tabBarIcon

                  const onPress = () => {
                    const event = props.navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    })

                    if (!isFocused && !event.defaultPrevented) {
                      props.navigation.navigate(route.name)
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={route.key}
                      accessibilityRole="button"
                      accessibilityState={isFocused ? { selected: true } : {}}
                      accessibilityLabel={options.tabBarAccessibilityLabel}
                      testID={options.tabBarTestID}
                      onPress={onPress}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      {IconComponent &&
                        IconComponent({
                          color: isFocused ? "#1DB954" : "#888",
                          size: 24,
                        })}
                      <Text
                        style={{
                          color: isFocused ? "#1DB954" : "#888",
                          fontSize: 10,
                          marginTop: 4,
                        }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )
        }}
        screenOptions={{
          headerShown: false,
        }}>
        {/* User tabs - Show when not ADMIN */}
        {userRole !== "ADMIN" && (
          <>
            <Tab.Screen
              name="Home"
              component={HomeStack}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <MaterialCommunityIcons
                    name="home"
                    size={size}
                    color={color}
                  />
                ),
                tabBarLabel: "Home",
              }}
            />
            <Tab.Screen
              name="Genres"
              component={GenreStack}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <MaterialCommunityIcons
                    name="music"
                    size={size}
                    color={color}
                  />
                ),
                tabBarLabel: "Genres",
              }}
            />
            <Tab.Screen
              name="Favorites"
              component={FavoritesStack}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <MaterialCommunityIcons
                    name="heart"
                    size={size}
                    color={color}
                  />
                ),
                tabBarLabel: "Favorites",
              }}
            />
            <Tab.Screen
              name="AI"
              component={AIStack}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <MaterialCommunityIcons
                    name="robot"
                    size={size}
                    color={color}
                  />
                ),
                tabBarLabel: "AI Music",
              }}
            />
          </>
        )}

        {/* Admin/Upload tab - Only visible when logged in */}
        {user && (
          <Tab.Screen
            name="Admin"
            component={AdminStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons
                  name={userRole === "ADMIN" ? "shield-account" : "upload"}
                  size={size}
                  color={color}
                />
              ),
              tabBarLabel: userRole === "ADMIN" ? "Admin" : "Upload",
            }}
          />
        )}

        {/* Profile tab - Always visible */}
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account"
                size={size}
                color={color}
              />
            ),
            tabBarLabel: "Profile",
          }}
        />
      </Tab.Navigator>
    </View>
  )
}
const RootNavigator = () => {
  const { loading } = useContext(AuthContext)

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
        }}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={{ ...DarkTheme }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always show main tabs first, not blocked by login */}
        <Stack.Screen name="MainTabs" component={AppTabs} />

        {/* Auth screens displayed as modals when user chooses to login/register */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MusicProvider>
          {Platform.OS === "ios" && <ExpoStatusBar style="light" />}
          {/* Android: dùng RN StatusBar để chắc chắn icon trắng */}
          {Platform.OS === "android" && (
            <RNStatusBar
              barStyle="light-content"
              backgroundColor="#1a1a1a"
              translucent={false}
            />
          )}
          {/* Đảm bảo tai thỏ có nền tối và không bị đè */}
          <SafeAreaView
            style={{ flex: 1, backgroundColor: "#1a1a1a" }}
            edges={["top"]}>
            <RootNavigator />
          </SafeAreaView>
        </MusicProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
