import React, { useContext, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicContext } from '../context/MusicContext';
import { db } from '../firebase';

const SongItem = ({ song, onPress }) => {
  const { toggleFavorite, isFavorite } = useContext(MusicContext);
  const [stats, setStats] = useState({
    plays: song.plays || 0,
    likes: song.likes || 0,
  });

  // Subscribe to real-time stats updates
  useEffect(() => {
    if (!song.id) return;

    const unsubscribe = db
      .collection('songs')
      .doc(song.id)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setStats({
              plays: data.plays || 0,
              likes: data.likes || 0,
            });
          }
        },
        (error) => {
          console.error('Error subscribing to song stats:', error);
        }
      );

    return () => unsubscribe();
  }, [song.id]);

  return (
    <TouchableOpacity style={styles.songItem} onPress={onPress}>
      <Image source={{ uri: song.cover }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
        <View style={styles.songStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="play" size={12} color="#888" />
            <Text style={styles.statText}>{stats.plays}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart" size={12} color="#888" />
            <Text style={styles.statText}>{stats.likes}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite(song);
        }}
        style={styles.favoriteButton}
      >
        <MaterialCommunityIcons
          name={isFavorite(song.id) ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavorite(song.id) ? '#FF6B6B' : '#888'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  songStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#888',
    fontSize: 11,
  },
  favoriteButton: {
    padding: 8,
  },
});

export default SongItem;

