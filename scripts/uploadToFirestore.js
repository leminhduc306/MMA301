/**
 * Script để upload dữ liệu từ JSON files lên Firestore
 * 
 * Cách chạy:
 * 1. Mở terminal trong thư mục project
 * 2. Chạy: node scripts/uploadToFirestore.js
 */

import { db } from '../firebase.js';
import songsData from '../data/songs.json' assert { type: 'json' };
import albumsData from '../data/albums.json' assert { type: 'json' };
import genresData from '../data/genres.json' assert { type: 'json' };

const uploadSongs = async () => {
    console.log('📤 Uploading songs...');
    const batch = db.batch();
    let count = 0;

    for (const song of songsData.songs) {
        const songRef = db.collection('songs').doc(song.id);
        batch.set(songRef, {
            title: song.title,
            artist: song.artist,
            album: song.album,
            genre: song.genre,
            duration: song.duration,
            url: song.url,
            cover: song.cover,
            plays: song.plays || 0,
            likes: song.likes || 0,
            createdAt: song.createdAt ? new Date(song.createdAt) : new Date(),
            updatedAt: new Date(),
        });
        count++;
    }

    await batch.commit();
    console.log(`✅ Uploaded ${count} songs successfully!`);
};

const uploadAlbums = async () => {
    console.log('📤 Uploading albums...');
    const batch = db.batch();
    let count = 0;

    for (const album of albumsData.albums) {
        const albumRef = db.collection('albums').doc(album.id);
        batch.set(albumRef, {
            title: album.title,
            artist: album.artist,
            genre: album.genre,
            cover: album.cover,
            year: album.year,
            songs: album.songs || [],
            totalDuration: album.totalDuration || 0,
            description: album.description || '',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        count++;
    }

    await batch.commit();
    console.log(`✅ Uploaded ${count} albums successfully!`);
};

const uploadGenres = async () => {
    console.log('📤 Uploading genres...');
    const batch = db.batch();
    let count = 0;

    for (const genre of genresData.genres) {
        const genreRef = db.collection('genres').doc(genre.id);
        batch.set(genreRef, {
            name: genre.name,
            icon: genre.icon,
            color: genre.color,
            description: genre.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        count++;
    }

    await batch.commit();
    console.log(`✅ Uploaded ${count} genres successfully!`);
};

const uploadAll = async () => {
    try {
        console.log('🚀 Starting upload to Firestore...\n');

        await uploadSongs();
        await uploadAlbums();
        await uploadGenres();

        console.log('\n✨ All data uploaded successfully!');
        console.log('📊 Check your Firestore console to verify the data.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error uploading data:', error);
        process.exit(1);
    }
};

// Run the upload
uploadAll();


