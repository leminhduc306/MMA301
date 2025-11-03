import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(
            async (firebaseUser) => {
                if (firebaseUser) {
                    console.log('AuthContext - Firebase User UID:', firebaseUser.uid);

                    // Get user info from Firestore
                    try {
                        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            // Create clean user object with only needed properties
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: userData.displayName || firebaseUser.displayName,
                                role: userData.role,
                                photoURL: firebaseUser.photoURL,
                            });
                            setUserRole(userData.role);
                            console.log('AuthContext - User loaded with UID:', firebaseUser.uid);
                        } else {
                            // Default to USER role if no document exists
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                role: 'USER',
                                photoURL: firebaseUser.photoURL,
                            });
                            setUserRole('USER');
                            console.log('AuthContext - User loaded (no doc) with UID:', firebaseUser.uid);
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                        // Fallback to basic user object
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            role: 'USER',
                            photoURL: firebaseUser.photoURL,
                        });
                        setUserRole('USER');
                    }
                } else {
                    setUser(null);
                    setUserRole(null);
                    console.log('AuthContext - User logged out');
                }
                setLoading(false);
            },
            (error) => {
                setError(error.message);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    const register = async (email, password, displayName) => {
        try {
            setError(null);
            const result = await auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName });

            // Save user info to Firestore with USER role by default
            await db.collection('users').doc(result.user.uid).set({
                uid: result.user.uid,
                email: result.user.email,
                displayName: displayName,
                role: 'USER', // Default role
                phone: '',
                address: '',
                avatar: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return result.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const result = await auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            setError(null);
            await auth.signOut();
            setUser(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const resetPassword = async (email) => {
        try {
            setError(null);
            await auth.sendPasswordResetEmail(email);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateProfile = async (updates) => {
        try {
            setError(null);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No user logged in');
            }

            // Update Firebase Auth profile
            await currentUser.updateProfile(updates);

            // Update Firestore
            if (currentUser.uid) {
                await db.collection('users').doc(currentUser.uid).update({
                    ...updates,
                    updatedAt: new Date(),
                });
            }

            // Update local state
            setUser({ ...user, ...updates });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const changePassword = async (newPassword) => {
        try {
            setError(null);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No user logged in');
            }
            await currentUser.updatePassword(newPassword);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userRole,
                loading,
                error,
                register,
                login,
                logout,
                resetPassword,
                updateProfile,
                changePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
