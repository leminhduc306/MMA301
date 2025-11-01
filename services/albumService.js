import { db } from '../firebase';

const ALBUMS_COLLECTION = 'albums';

export const albumService = {
  // Get all albums
  getAllAlbums: async () => {
    try {
      const snapshot = await db.collection(ALBUMS_COLLECTION).get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting albums:', error);
      throw error;
    }
  },

  // Get album by ID
  getAlbumById: async (albumId) => {
    try {
      const doc = await db.collection(ALBUMS_COLLECTION).doc(albumId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Error getting album:', error);
      throw error;
    }
  },

  // Get albums by artist
  getAlbumsByArtist: async (artist) => {
    try {
      const snapshot = await db
        .collection(ALBUMS_COLLECTION)
        .where('artist', '==', artist)
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting albums by artist:', error);
      throw error;
    }
  },

  // Create album (Admin)
  createAlbum: async (albumData) => {
    try {
      const docRef = await db.collection(ALBUMS_COLLECTION).add({
        ...albumData,
        createdAt: new Date(),
      });
      return { id: docRef.id, ...albumData };
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  },

  // Update album
  updateAlbum: async (albumId, updates) => {
    try {
      await db.collection(ALBUMS_COLLECTION).doc(albumId).update(updates);
      return { id: albumId, ...updates };
    } catch (error) {
      console.error('Error updating album:', error);
      throw error;
    }
  },

  // Delete album (Admin)
  deleteAlbum: async (albumId) => {
    try {
      await db.collection(ALBUMS_COLLECTION).doc(albumId).delete();
    } catch (error) {
      console.error('Error deleting album:', error);
      throw error;
    }
  },

  // Search albums
  searchAlbums: async (query) => {
    try {
      const snapshot = await db.collection(ALBUMS_COLLECTION).get();
      const results = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (album) =>
            album.title.toLowerCase().includes(query.toLowerCase()) ||
            album.artist.toLowerCase().includes(query.toLowerCase())
        );
      return results;
    } catch (error) {
      console.error('Error searching albums:', error);
      throw error;
    }
  },
};
