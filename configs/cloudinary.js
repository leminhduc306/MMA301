/**
 * Cloudinary Configuration
 * 
 * Cloud Name: dff989w82
 * 
 * Lấy từ: https://cloudinary.com/console
 * hoặc dùng config từ project SDN302_GROUP2_MUSIC-APP
 */

export const CLOUDINARY_CONFIG = {
  cloudName: 'dff989w82',
  uploadPreset: 'zingmp3_upload', // PHẢI LÀ UNSIGNED PRESET!
    apiKey: '351746993553398',
    // Note: API Secret không được expose ở client-side
    // Chỉ dùng upload preset (unsigned upload)
    // 
    // ⚠️ QUAN TRỌNG: Nếu lỗi "Upload preset not found":
    // 1. Truy cập: https://console.cloudinary.com/settings/upload
    // 2. Tạo preset mới: 'zingmp3_upload' (Unsigned mode)
    // 3. Hoặc check preset có sẵn và update tên ở đây
};

// Cloudinary folders
export const CLOUDINARY_FOLDERS = {
    songs: 'zingmp3/songs',
    covers: 'zingmp3/covers',
    albums: 'zingmp3/albums',
    artists: 'zingmp3/artists',
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`;

export default CLOUDINARY_CONFIG;

