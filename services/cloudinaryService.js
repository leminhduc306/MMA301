/**
 * Cloudinary Upload Service for React Native
 * 
 * Upload audio files and images to Cloudinary
 * Returns direct URLs for streaming/display
 */

import { CLOUDINARY_CONFIG, CLOUDINARY_FOLDERS, CLOUDINARY_UPLOAD_URL } from '../configs/cloudinary';

export const cloudinaryService = {
    /**
     * Upload file lên Cloudinary
     * @param {string} uri - Local file URI từ ImagePicker/DocumentPicker
     * @param {string} fileType - 'image' hoặc 'audio'
     * @param {string} folder - Folder name trong Cloudinary (optional)
     * @returns {Promise<string>} Cloudinary URL
     */
    uploadFile: async (uri, fileType = 'auto', folder = 'zingmp3/files') => {
        try {
            // Tạo FormData
            const formData = new FormData();

            // Lấy file extension
            const uriParts = uri.split('.');
            const fileExtension = uriParts[uriParts.length - 1];

            // Determine MIME type
            let mimeType = 'application/octet-stream';
            if (fileType === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension.toLowerCase())) {
                mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
            } else if (fileType === 'audio' || ['mp3', 'wav', 'm4a', 'aac'].includes(fileExtension.toLowerCase())) {
                mimeType = `audio/${fileExtension}`;
            } else if (fileType === 'video' || ['mp4', 'mov', 'avi'].includes(fileExtension.toLowerCase())) {
                mimeType = `video/${fileExtension}`;
            }

            // Append file
            formData.append('file', {
                uri,
                type: mimeType,
                name: `upload_${Date.now()}.${fileExtension}`,
            });

            // Cloudinary params
            formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            formData.append('folder', folder);
            formData.append('resource_type', 'auto'); // Auto-detect: image/video/raw

            // Optional: Add tags for better organization
            formData.append('tags', 'zingmp3,react-native');

            console.log('Uploading to Cloudinary...', { folder, fileType });

            // Upload request
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Cloudinary upload error:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            console.log('Cloudinary upload success:', {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                bytes: result.bytes,
            });

            return result.secure_url;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        }
    },

    /**
     * Upload ảnh cover (song/album)
     * @param {string} uri - Image URI
     * @param {string} type - 'song' hoặc 'album'
     * @returns {Promise<string>} Cloudinary URL
     */
    uploadCoverImage: async (uri, type = 'song') => {
        const folder = type === 'album' ? CLOUDINARY_FOLDERS.albums : CLOUDINARY_FOLDERS.covers;
        return await cloudinaryService.uploadFile(uri, 'image', folder);
    },

    /**
     * Upload audio file (MP3, etc.)
     * @param {string} uri - Audio file URI
     * @returns {Promise<string>} Cloudinary URL
     */
    uploadAudioFile: async (uri) => {
        return await cloudinaryService.uploadFile(uri, 'audio', CLOUDINARY_FOLDERS.songs);
    },

    /**
     * Upload with progress tracking
     * @param {string} uri - File URI
     * @param {string} fileType - 'image', 'audio', or 'auto'
     * @param {string} folder - Cloudinary folder
     * @param {function} onProgress - Progress callback (0-100)
     * @returns {Promise<string>} Cloudinary URL
     */
    uploadWithProgress: async (uri, fileType, folder, onProgress) => {
        try {
            // Note: FormData upload với fetch không hỗ trợ progress tracking tốt
            // Nếu cần progress, phải dùng XMLHttpRequest

            if (onProgress) onProgress(10); // Start

            const formData = new FormData();

            const uriParts = uri.split('.');
            const fileExtension = uriParts[uriParts.length - 1];

            let mimeType = 'application/octet-stream';
            if (fileType === 'image') {
                mimeType = `image/${fileExtension}`;
            } else if (fileType === 'audio') {
                mimeType = `audio/${fileExtension}`;
            }

            formData.append('file', {
                uri,
                type: mimeType,
                name: `upload_${Date.now()}.${fileExtension}`,
            });

            formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            formData.append('folder', folder);
            formData.append('resource_type', 'auto');

            if (onProgress) onProgress(30); // Preparing

            console.log('Uploading to Cloudinary with progress...', { folder, fileType });

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Upload progress
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        onProgress(percentComplete);
                    }
                });

                // Upload complete
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            console.log('Upload successful:', result.secure_url);
                            if (onProgress) onProgress(100);
                            resolve(result.secure_url);
                        } catch (error) {
                            reject(new Error('Failed to parse response'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
                    }
                });

                // Error
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                // Timeout
                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timeout'));
                });

                // Send request
                xhr.open('POST', CLOUDINARY_UPLOAD_URL);
                xhr.timeout = 60000; // 60 seconds
                xhr.send(formData);
            });
        } catch (error) {
            console.error('Error uploading with progress:', error);
            throw error;
        }
    },

    /**
     * Delete file từ Cloudinary (cần API key, nên làm từ backend)
     * Client-side không thể xóa trực tiếp do security
     * @param {string} publicId - Cloudinary public_id
     */
    deleteFile: async (publicId) => {
        // Note: Không thể delete từ client-side vì cần api_secret
        // Phải làm qua backend API
        console.warn('Delete file requires backend API endpoint');
        throw new Error('Delete operation must be done through backend API');
    },
};

export default cloudinaryService;


