/**
 * Custom hook for real-time song statistics (plays & likes)
 */

import { useState, useEffect } from 'react';
import { db } from '../firebase';

export const useSongStats = (songId) => {
  const [stats, setStats] = useState({
    plays: 0,
    likes: 0,
    loading: true,
  });

  useEffect(() => {
    if (!songId) {
      setStats({ plays: 0, likes: 0, loading: false });
      return;
    }

    // Subscribe to real-time updates for this song
    const unsubscribe = db
      .collection('songs')
      .doc(songId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setStats({
              plays: data.plays || 0,
              likes: data.likes || 0,
              loading: false,
            });
          } else {
            setStats({ plays: 0, likes: 0, loading: false });
          }
        },
        (error) => {
          console.error('Error subscribing to song stats:', error);
          setStats({ plays: 0, likes: 0, loading: false });
        }
      );

    return () => unsubscribe();
  }, [songId]);

  return stats;
};

export default useSongStats;

