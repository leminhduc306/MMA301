import { db } from '../firebase';
import firebase from 'firebase/compat/app';

const SONGS_COLLECTION = 'songs';

export const songService = {
  // Get all songs
  getAllSongs: async () => {
    try {
      const snapshot = await db.collection(SONGS_COLLECTION).get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting songs:', error);
      throw error;
    }
  },

  // Get song by ID
  getSongById: async (songId) => {
    try {
      const doc = await db.collection(SONGS_COLLECTION).doc(songId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Error getting song:', error);
      throw error;
    }
  },

  // Get songs by genre
  getSongsByGenre: async (genre) => {
    try {
      const snapshot = await db
        .collection(SONGS_COLLECTION)
        .where('genre', '==', genre)
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting songs by genre:', error);
      throw error;
    }
  },

  // Get songs by artist
  getSongsByArtist: async (artist) => {
    try {
      const snapshot = await db
        .collection(SONGS_COLLECTION)
        .where('artist', '==', artist)
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting songs by artist:', error);
      throw error;
    }
  },

  // Create song (Admin or User)
  createSong: async (songData, userId) => {
    try {
      const docRef = await db.collection(SONGS_COLLECTION).add({
        ...songData,
        createdBy: userId, // Track who created this song
        createdAt: new Date(),
        updatedAt: new Date(),
        plays: 0,
        likes: 0,
      });
      return { id: docRef.id, ...songData };
    } catch (error) {
      console.error('Error creating song:', error);
      throw error;
    }
  },

  // Get songs by creator
  getSongsByCreator: async (userId) => {
    try {
      const snapshot = await db
        .collection(SONGS_COLLECTION)
        .where('createdBy', '==', userId)
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting songs by creator:', error);
      throw error;
    }
  },

  // Update song
  updateSong: async (songId, updates) => {
    try {
      await db.collection(SONGS_COLLECTION).doc(songId).update({
        ...updates,
        updatedAt: new Date(),
      });
      return { id: songId, ...updates };
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  },

  // Increment plays
  incrementPlays: async (songId) => {
    try {
      await db
        .collection(SONGS_COLLECTION)
        .doc(songId)
        .update({
          plays: firebase.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('Error incrementing plays:', error);
      throw error;
    }
  },

  // Increment likes
  incrementLikes: async (songId) => {
    try {
      await db
        .collection(SONGS_COLLECTION)
        .doc(songId)
        .update({
          likes: firebase.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('Error incrementing likes:', error);
      throw error;
    }
  },

  // Delete song (Admin)
  deleteSong: async (songId) => {
    try {
      await db.collection(SONGS_COLLECTION).doc(songId).delete();
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  },

  // Search songs
  searchSongs: async (query) => {
    try {
      const snapshot = await db.collection(SONGS_COLLECTION).get();
      const results = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (song) =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase())
        );
      return results;
    } catch (error) {
      console.error('Error searching songs:', error);
      throw error;
    }
  },
};
