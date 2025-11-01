import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';

const storage = firebase.storage();

export const storageService = {
    /**
     * Upload ảnh cover lên Firebase Storage
     * @param {string} uri - URI của ảnh từ image picker
     * @param {string} type - 'song' hoặc 'album'
     * @returns {Promise<string>} URL của ảnh đã upload
     */
    uploadCoverImage: async (uri, type = 'song') => {
        try {
            console.log('Starting cover image upload...', { uri, type });

            const response = await fetch(uri);
            const blob = await response.blob();

            console.log('Blob created:', { size: blob.size, type: blob.type });

            const timestamp = Date.now();
            const filename = `${type}_cover_${timestamp}.jpg`;
            const storageRef = storage.ref().child(`covers/${type}s/${filename}`);

            console.log('Storage ref path:', storageRef.fullPath);

            await storageRef.put(blob);
            const downloadURL = await storageRef.getDownloadURL();

            console.log('Upload successful! URL:', downloadURL);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading cover image:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                serverResponse: error.serverResponse,
            });
            throw new Error(`Upload failed: ${error.message}. Please check Firebase Storage setup.`);
        }
    },

    /**
     * Upload file audio lên Firebase Storage
     * @param {string} uri - URI của audio file từ document picker
     * @param {string} filename - Tên file gốc
     * @returns {Promise<string>} URL của audio đã upload
     */
    uploadAudioFile: async (uri, filename) => {
        try {
            console.log('Starting audio file upload...', { uri, filename });

            const response = await fetch(uri);
            const blob = await response.blob();

            console.log('Audio blob created:', { size: blob.size, type: blob.type });

            const timestamp = Date.now();
            const ext = filename.split('.').pop();
            const newFilename = `song_${timestamp}.${ext}`;
            const storageRef = storage.ref().child(`audio/${newFilename}`);

            console.log('Storage ref path:', storageRef.fullPath);

            // Upload với metadata
            const metadata = {
                contentType: 'audio/mpeg',
            };

            await storageRef.put(blob, metadata);
            const downloadURL = await storageRef.getDownloadURL();

            console.log('Audio upload successful! URL:', downloadURL);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading audio file:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                serverResponse: error.serverResponse,
            });
            throw new Error(`Upload failed: ${error.message}. Please check Firebase Storage setup.`);
        }
    },

    /**
     * Xóa file từ Firebase Storage (dùng khi xóa song/album)
     * @param {string} url - URL của file cần xóa
     */
    deleteFile: async (url) => {
        try {
            const fileRef = storage.refFromURL(url);
            await fileRef.delete();
        } catch (error) {
            console.error('Error deleting file:', error);
            // Không throw error vì file có thể đã bị xóa hoặc không tồn tại
        }
    },

    /**
     * Upload progress listener
     * @param {string} uri - URI của file
     * @param {string} path - Đường dẫn trong Storage
     * @param {function} onProgress - Callback nhận progress (0-100)
     * @returns {Promise<string>} URL của file đã upload
     */
    uploadWithProgress: async (uri, path, onProgress) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = storage.ref().child(path);
            const uploadTask = storageRef.put(blob);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) {
                            onProgress(Math.round(progress));
                        }
                    },
                    (error) => {
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error('Error uploading with progress:', error);
            throw error;
        }
    },
};

