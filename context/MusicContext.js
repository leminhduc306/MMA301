import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { Audio } from 'expo-av';
import { AuthContext } from './AuthContext';
import { favoriteService } from '../services/favoriteService';
import { songService } from '../services/songService';

export const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sound, setSound] = useState(null);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [favorites, setFavorites] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState([]); // For quick lookup
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    const playSong = useCallback(async (song, songList = []) => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: song.url },
                { shouldPlay: true }
            );

            setSound(newSound);
            setCurrentSong(song);
            setIsPlaying(true);
            setPlaylist(songList.length > 0 ? songList : [song]);
            setCurrentIndex(0);

            // Increment play count in background
            if (song.id) {
                songService.incrementPlays(song.id).catch(err =>
                    console.error('Failed to increment play count:', err)
                );
            }

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    setDuration(status.durationMillis);
                    setPosition(status.positionMillis);
                    if (status.didJustFinish) {
                        playNext();
                    }
                }
            });
        } catch (error) {
            console.error('Error playing song:', error);
        }
    }, [sound]);

    const pauseSong = useCallback(async () => {
        if (sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
        }
    }, [sound]);

    const resumeSong = useCallback(async () => {
        if (sound) {
            await sound.playAsync();
            setIsPlaying(true);
        }
    }, [sound]);

    const playNext = useCallback(async () => {
        const nextIndex = (currentIndex + 1) % playlist.length;
        if (playlist[nextIndex]) {
            await playSong(playlist[nextIndex], playlist);
            setCurrentIndex(nextIndex);
        }
    }, [currentIndex, playlist, playSong]);

    const playPrevious = useCallback(async () => {
        const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
        if (playlist[prevIndex]) {
            await playSong(playlist[prevIndex], playlist);
            setCurrentIndex(prevIndex);
        }
    }, [currentIndex, playlist, playSong]);

    const seek = useCallback(async (position) => {
        if (sound) {
            await sound.setPositionAsync(position);
            setPosition(position);
        }
    }, [sound]);

    // Subscribe to real-time favorites updates when user logs in
    useEffect(() => {
        if (user && user.uid) {
            console.log('Setting up real-time favorites listener...');

            // Subscribe to real-time updates
            const unsubscribe = favoriteService.subscribeToUserFavorites(
                user.uid,
                songService.getSongById,
                (favoriteSongs) => {
                    setFavorites(favoriteSongs);
                    setFavoriteIds(favoriteSongs.map(song => song.id));
                    setLoadingFavorites(false);
                }
            );

            // Cleanup subscription on unmount or user change
            return () => {
                console.log('Unsubscribing from favorites listener');
                unsubscribe();
            };
        } else {
            // Clear favorites when user logs out
            setFavorites([]);
            setFavoriteIds([]);
            setLoadingFavorites(false);
        }
    }, [user]);

    const loadFavorites = useCallback(async () => {
        if (!user || !user.uid) {
            setFavorites([]);
            setFavoriteIds([]);
            return;
        }

        try {
            setLoadingFavorites(true);

            // Get favorite songs with full data
            const favoriteSongs = await favoriteService.getUserFavoriteSongs(
                user.uid,
                songService.getSongById
            );

            setFavorites(favoriteSongs);
            setFavoriteIds(favoriteSongs.map(song => song.id));

            console.log(`Loaded ${favoriteSongs.length} favorite songs`);
        } catch (error) {
            console.error('Error loading favorites:', error);
            setFavorites([]);
            setFavoriteIds([]);
        } finally {
            setLoadingFavorites(false);
        }
    }, [user]);

    const toggleFavorite = useCallback(async (song) => {
        if (!user || !user.uid) {
            console.log('User must be logged in to add favorites');
            return;
        }

        try {
            // Optimistic update
            const isCurrentlyFavorite = favoriteIds.includes(song.id);

            if (isCurrentlyFavorite) {
                // Remove from favorites
                setFavorites(prev => prev.filter(fav => fav.id !== song.id));
                setFavoriteIds(prev => prev.filter(id => id !== song.id));
                await favoriteService.removeFavorite(user.uid, song.id);

                // Update song likes count
                const newCount = await favoriteService.getFavoriteCount(song.id);
                await songService.updateLikesCount(song.id, newCount);

                console.log('Removed from favorites:', song.title);
                console.log('Updated likes count to:', newCount);
            } else {
                // Add to favorites
                setFavorites(prev => [song, ...prev]);
                setFavoriteIds(prev => [song.id, ...prev]);
                await favoriteService.addFavorite(user.uid, song.id);

                // Update song likes count
                const newCount = await favoriteService.getFavoriteCount(song.id);
                await songService.updateLikesCount(song.id, newCount);

                console.log('Added to favorites:', song.title);
                console.log('Updated likes count to:', newCount);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Reload favorites on error to sync with server
            await loadFavorites();
        }
    }, [user, favoriteIds, loadFavorites]);

    const isFavorite = useCallback(
        (songId) => favoriteIds.includes(songId),
        [favoriteIds]
    );

    return (
        <MusicContext.Provider
            value={{
                currentSong,
                isPlaying,
                playlist,
                sound,
                duration,
                position,
                favorites,
                loadingFavorites,
                playSong,
                pauseSong,
                resumeSong,
                playNext,
                playPrevious,
                seek,
                toggleFavorite,
                isFavorite,
                loadFavorites, // Export for manual refresh
            }}
        >
            {children}
        </MusicContext.Provider>
    );
};
