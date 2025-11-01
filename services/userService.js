import { db } from '../firebase';

const USERS_COLLECTION = 'users';

export const userService = {
  // Get user by ID
  getUserById: async (userId) => {
    try {
      const doc = await db.collection(USERS_COLLECTION).doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Get all users (Admin only)
  getAllUsers: async () => {
    try {
      const snapshot = await db.collection(USERS_COLLECTION).get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Create user (called during registration)
  createUser: async (userId, userData) => {
    try {
      await db.collection(USERS_COLLECTION).doc(userId).set({
        uid: userId,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id: userId, ...userData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user profile
  updateUser: async (userId, updates) => {
    try {
      await db.collection(USERS_COLLECTION).doc(userId).update({
        ...updates,
        updatedAt: new Date(),
      });
      return { id: userId, ...updates };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (userId, role) => {
    try {
      await db.collection(USERS_COLLECTION).doc(userId).update({
        role: role,
        updatedAt: new Date(),
      });
      return { id: userId, role };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Delete user (Admin only - soft delete)
  deleteUser: async (userId) => {
    try {
      // Don't actually delete, just mark as inactive
      await db.collection(USERS_COLLECTION).doc(userId).update({
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};


