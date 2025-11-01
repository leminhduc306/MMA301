/**
 * Genre Service - CRUD operations for Genres
 */

import { db } from '../firebase';
import firebase from 'firebase/compat/app';

const GENRES_COLLECTION = 'genres';

export const genreService = {
  /**
   * Get all genres
   * @returns {Promise<Array>} List of genres
   */
  getAllGenres: async () => {
    try {
      const snapshot = await db.collection(GENRES_COLLECTION).orderBy('name', 'asc').get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting all genres:', error);
      throw error;
    }
  },

  /**
   * Get genre by ID
   * @param {string} genreId - Genre ID
   * @returns {Promise<Object>} Genre object
   */
  getGenreById: async (genreId) => {
    try {
      const doc = await db.collection(GENRES_COLLECTION).doc(genreId).get();
      if (!doc.exists) {
        throw new Error('Genre not found');
      }
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error('Error getting genre by ID:', error);
      throw error;
    }
  },

  /**
   * Create new genre
   * @param {Object} genreData - Genre data
   * @returns {Promise<Object>} Created genre
   */
  createGenre: async (genreData) => {
    try {
      const newGenre = {
        ...genreData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection(GENRES_COLLECTION).add(newGenre);
      
      return {
        id: docRef.id,
        ...newGenre,
      };
    } catch (error) {
      console.error('Error creating genre:', error);
      throw error;
    }
  },

  /**
   * Update genre
   * @param {string} genreId - Genre ID
   * @param {Object} updates - Updated data
   * @returns {Promise<Object>} Updated genre
   */
  updateGenre: async (genreId, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection(GENRES_COLLECTION).doc(genreId).update(updatedData);

      return {
        id: genreId,
        ...updatedData,
      };
    } catch (error) {
      console.error('Error updating genre:', error);
      throw error;
    }
  },

  /**
   * Delete genre
   * @param {string} genreId - Genre ID
   * @returns {Promise<void>}
   */
  deleteGenre: async (genreId) => {
    try {
      await db.collection(GENRES_COLLECTION).doc(genreId).delete();
    } catch (error) {
      console.error('Error deleting genre:', error);
      throw error;
    }
  },

  /**
   * Search genres by name
   * @param {string} searchQuery - Search query
   * @returns {Promise<Array>} Matching genres
   */
  searchGenres: async (searchQuery) => {
    try {
      const snapshot = await db
        .collection(GENRES_COLLECTION)
        .orderBy('name')
        .startAt(searchQuery)
        .endAt(searchQuery + '\uf8ff')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error searching genres:', error);
      throw error;
    }
  },

  /**
   * Get songs count by genre
   * @param {string} genreId - Genre ID
   * @returns {Promise<number>} Number of songs in this genre
   */
  getSongsCountByGenre: async (genreId) => {
    try {
      const snapshot = await db
        .collection('songs')
        .where('genreId', '==', genreId)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error getting songs count:', error);
      return 0;
    }
  },
};

export default genreService;

