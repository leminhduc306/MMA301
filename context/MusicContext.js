import React, { createContext, useState, useCallback } from 'react';
import { Audio } from 'expo-av';

export const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sound, setSound] = useState(null);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [favorites, setFavorites] = useState([]);

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

    const toggleFavorite = useCallback((song) => {
        setFavorites((prevFavorites) => {
            const isFavorite = prevFavorites.find((fav) => fav.id === song.id);
            if (isFavorite) {
                return prevFavorites.filter((fav) => fav.id !== song.id);
            } else {
                return [...prevFavorites, song];
            }
        });
    }, []);

    const isFavorite = useCallback(
        (songId) => favorites.some((fav) => fav.id === songId),
        [favorites]
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
                playSong,
                pauseSong,
                resumeSong,
                playNext,
                playPrevious,
                seek,
                toggleFavorite,
                isFavorite,
            }}
        >
            {children}
        </MusicContext.Provider>
    );
};
