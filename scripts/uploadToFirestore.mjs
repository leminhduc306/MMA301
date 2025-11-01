/**
 * Script để upload dữ liệu từ JSON files lên Firestore
 * 
 * Cách chạy:
 * 1. Mở terminal trong thư mục project
 * 2. Chạy: node scripts/uploadToFirestore.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from '../firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read JSON files
const songsData = JSON.parse(
    readFileSync(join(__dirname, '../data/songs.json'), 'utf8')
);
const albumsData = JSON.parse(
    readFileSync(join(__dirname, '../data/albums.json'), 'utf8')
);
const genresData = JSON.parse(
    readFileSync(join(__dirname, '../data/genres.json'), 'utf8')
);

const uploadSongs = async () => {
    console.log('📤 Uploading songs...');

    for (const song of songsData.songs) {
        try {
            await db.collection('songs').doc(song.id).set({
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
        } catch (error) {
            console.error(`Error uploading song ${song.id}:`, error);
        }
    }

    console.log(`✅ Uploaded ${songsData.songs.length} songs successfully!`);
};

const uploadAlbums = async () => {
    console.log('📤 Uploading albums...');

    for (const album of albumsData.albums) {
        try {
            await db.collection('albums').doc(album.id).set({
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
        } catch (error) {
            console.error(`Error uploading album ${album.id}:`, error);
        }
    }

    console.log(`✅ Uploaded ${albumsData.albums.length} albums successfully!`);
};

const uploadGenres = async () => {
    console.log('📤 Uploading genres...');

    for (const genre of genresData.genres) {
        try {
            await db.collection('genres').doc(genre.id).set({
                name: genre.name,
                icon: genre.icon,
                color: genre.color,
                description: genre.description,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        } catch (error) {
            console.error(`Error uploading genre ${genre.id}:`, error);
        }
    }

    console.log(`✅ Uploaded ${genresData.genres.length} genres successfully!`);
};

const uploadAll = async () => {
    try {
        console.log('🚀 Starting upload to Firestore...\n');

        await uploadSongs();
        console.log('');
        await uploadAlbums();
        console.log('');
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


