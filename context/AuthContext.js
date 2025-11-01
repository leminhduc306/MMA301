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
                    // Lấy thông tin user từ Firestore
                    try {
                        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            setUser({
                                ...firebaseUser,
                                role: userData.role,
                                displayName: userData.displayName,
                            });
                            setUserRole(userData.role);
                        } else {
                            setUser(firebaseUser);
                            setUserRole('USER');
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                        setUser(firebaseUser);
                        setUserRole('USER');
                    }
                } else {
                    setUser(null);
                    setUserRole(null);
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

            // Lưu user info vào Firestore
            await db.collection('users').doc(result.user.uid).set({
                uid: result.user.uid,
                email: result.user.email,
                displayName: displayName,
                role: 'USER', // Mặc định là USER
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
            await user.updateProfile(updates);
            setUser({ ...user, ...updates });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const changePassword = async (newPassword) => {
        try {
            setError(null);
            await user.updatePassword(newPassword);
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
