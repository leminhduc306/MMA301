/**
 * Favorite Service - CRUD operations for user favorites
 * Collection structure: favorites
 * Document structure: {
 *   userId: string,
 *   songId: string,
 *   createdAt: timestamp
 * }
 */

import { db } from '../firebase';
import firebase from 'firebase/compat/app';

const FAVORITES_COLLECTION = 'favorites';

export const favoriteService = {
  /**
   * Add song to user's favorites
   * @param {string} userId - User ID
   * @param {string} songId - Song ID
   * @returns {Promise<Object>} Created favorite
   */
  addFavorite: async (userId, songId) => {
    try {
      // Check if already exists
      const existing = await db
        .collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .where('songId', '==', songId)
        .get();

      if (!existing.empty) {
        console.log('Already in favorites');
        return { id: existing.docs[0].id, ...existing.docs[0].data() };
      }

      // Add new favorite
      const docRef = await db.collection(FAVORITES_COLLECTION).add({
        userId: userId,
        songId: songId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return {
        id: docRef.id,
        userId,
        songId,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  /**
   * Remove song from user's favorites
   * @param {string} userId - User ID
   * @param {string} songId - Song ID
   * @returns {Promise<void>}
   */
  removeFavorite: async (userId, songId) => {
    try {
      const snapshot = await db
        .collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .where('songId', '==', songId)
        .get();

      if (snapshot.empty) {
        console.log('Favorite not found');
        return;
      }

      // Delete all matching documents (should be only one)
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },

  /**
   * Get all favorite song IDs for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>>} Array of song IDs
   */
  getUserFavoriteIds: async (userId) => {
    try {
      if (!userId) return [];

      const snapshot = await db
        .collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .get();

      return snapshot.docs.map((doc) => doc.data().songId);
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  },

  /**
   * Get all favorite songs with full song data for a user
   * @param {string} userId - User ID
   * @param {Function} getSongById - Function to get song by ID
   * @returns {Promise<Array>} Array of songs
   */
  getUserFavoriteSongs: async (userId, getSongById) => {
    try {
      if (!userId) return [];

      // Simple query without orderBy to avoid index requirement
      const snapshot = await db
        .collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .get();

      const songIds = snapshot.docs.map((doc) => doc.data().songId);

      // Fetch all songs
      const songs = await Promise.all(
        songIds.map(async (songId) => {
          try {
            return await getSongById(songId);
          } catch (error) {
            console.error(`Error fetching song ${songId}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (deleted songs)
      return songs.filter((song) => song !== null);
    } catch (error) {
      console.error('Error getting favorite songs:', error);
      throw error;
    }
  },

  /**
   * Subscribe to user's favorite changes (real-time)
   * @param {string} userId - User ID
   * @param {Function} getSongById - Function to get song by ID
   * @param {Function} onUpdate - Callback when favorites change
   * @returns {Function} Unsubscribe function
   */
  subscribeToUserFavorites: (userId, getSongById, onUpdate) => {
    if (!userId) {
      console.log('No userId provided for subscription');
      return () => { };
    }

    console.log('Subscribing to favorites for user:', userId);

    const unsubscribe = db
      .collection(FAVORITES_COLLECTION)
      .where('userId', '==', userId)
      .onSnapshot(
        async (snapshot) => {
          try {
            const songIds = snapshot.docs.map((doc) => doc.data().songId);

            // Fetch all songs
            const songs = await Promise.all(
              songIds.map(async (songId) => {
                try {
                  return await getSongById(songId);
                } catch (error) {
                  console.error(`Error fetching song ${songId}:`, error);
                  return null;
                }
              })
            );

            // Filter out null values
            const validSongs = songs.filter((song) => song !== null);
            console.log(`Favorites updated: ${validSongs.length} songs`);
            onUpdate(validSongs);
          } catch (error) {
            console.error('Error processing favorites snapshot:', error);
          }
        },
        (error) => {
          console.error('Error subscribing to favorites:', error);
        }
      );

    return unsubscribe;
  },

  /**
   * Check if a song is in user's favorites
   * @param {string} userId - User ID
   * @param {string} songId - Song ID
   * @returns {Promise<boolean>}
   */
  isFavorite: async (userId, songId) => {
    try {
      if (!userId || !songId) return false;

      const snapshot = await db
        .collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .where('songId', '==', songId)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  /**
   * Get favorite count for a song
   * @param {string} songId - Song ID
   * @returns {Promise<number>}
   */
  getFavoriteCount: async (songId) => {
    try {
      const snapshot = await db
        .collection(FAVORITES_COLLECTION)
        .where('songId', '==', songId)
        .get();

      const count = snapshot.size;
      console.log(`Favorite count for song ${songId}: ${count}`);
      return count;
    } catch (error) {
      console.error('Error getting favorite count:', error);
      return 0;
    }
  },

  /**
   * Toggle favorite status and update song likes count
   * @param {string} userId - User ID
   * @param {string} songId - Song ID
   * @param {Function} updateSongLikes - Function to update song likes count
   * @returns {Promise<boolean>} True if added, false if removed
   */
  toggleFavorite: async (userId, songId, updateSongLikes = null) => {
    try {
      const isCurrentlyFavorite = await favoriteService.isFavorite(userId, songId);

      if (isCurrentlyFavorite) {
        await favoriteService.removeFavorite(userId, songId);

        // Update song likes count
        if (updateSongLikes) {
          const newCount = await favoriteService.getFavoriteCount(songId);
          await updateSongLikes(songId, newCount);
        }

        return false; // Removed
      } else {
        await favoriteService.addFavorite(userId, songId);

        // Update song likes count
        if (updateSongLikes) {
          const newCount = await favoriteService.getFavoriteCount(songId);
          await updateSongLikes(songId, newCount);
        }

        return true; // Added
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  /**
   * Clear all favorites for a user (for testing or user deletion)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  clearUserFavorites: async (userId) => {
    try {
      const snapshot = await db
        .collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  },
};

export default favoriteService;

