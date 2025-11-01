import { db } from '../firebase';
import firebase from 'firebase/compat/app';

const COMMENTS_COLLECTION = 'comments';

export const commentService = {
  // Get comments for a song
  getCommentsBySongId: async (songId) => {
    try {
      const snapshot = await db
        .collection(COMMENTS_COLLECTION)
        .where('songId', '==', songId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  // Create comment
  createComment: async (songId, userId, userName, text) => {
    try {
      const docRef = await db.collection(COMMENTS_COLLECTION).add({
        songId,
        userId,
        userName,
        text,
        createdAt: new Date(),
        likes: 0,
      });
      return {
        id: docRef.id,
        songId,
        userId,
        userName,
        text,
        createdAt: new Date(),
        likes: 0,
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Update comment
  updateComment: async (commentId, text) => {
    try {
      await db.collection(COMMENTS_COLLECTION).doc(commentId).update({
        text,
        updatedAt: new Date(),
      });
      return { id: commentId, text };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (commentId) => {
    try {
      await db.collection(COMMENTS_COLLECTION).doc(commentId).delete();
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Like comment
  likeComment: async (commentId) => {
    try {
      await db
        .collection(COMMENTS_COLLECTION)
        .doc(commentId)
        .update({
          likes: firebase.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },
};
