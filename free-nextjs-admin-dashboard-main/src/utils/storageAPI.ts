import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const storageAPI = {
    uploadFile: async (file: File, folder?: string): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) {
            formData.append('folder', folder);
        }

        const token = localStorage.getItem('token');

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'multipart/form-data',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(`${API_URL}/storage/upload`, formData, {
                headers,
                withCredentials: true,
            });
            return response.data.url;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    uploadProfileImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'multipart/form-data',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(`${API_URL}/storage/upload/profile-image`, formData, {
                headers,
                withCredentials: true,
            });
            return response.data.url;
        } catch (error) {
            console.error('Error uploading profile image:', error);
            throw error;
        }
    },
};
