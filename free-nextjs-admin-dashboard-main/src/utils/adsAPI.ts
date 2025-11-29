import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Ad {
    id: string;
    title: string;
    sponsor_name?: string;
    sponsor_tag?: string;
    profile_image_url?: string;
    details?: string;
    link_url?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAdRequest {
    title: string;
    sponsor_name?: string;
    sponsor_tag?: string;
    profile_image_url?: string;
    details?: string;
    link_url?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
}

export interface UpdateAdRequest {
    title?: string;
    sponsor_name?: string;
    sponsor_tag?: string;
    profile_image_url?: string;
    details?: string;
    link_url?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
}

export const adsAPI = {
    getAds: async (): Promise<Ad[]> => {
        const response = await axios.get(`${API_URL}/ads`);
        return response.data;
    },

    getAdById: async (id: string): Promise<Ad> => {
        const response = await axios.get(`${API_URL}/ads/${id}`);
        return response.data;
    },

    createAd: async (data: CreateAdRequest): Promise<Ad> => {
        const response = await axios.post(`${API_URL}/ads`, data);
        return response.data;
    },

    updateAd: async (id: string, data: UpdateAdRequest): Promise<Ad> => {
        const response = await axios.put(`${API_URL}/ads/${id}`, data);
        return response.data;
    },

    deleteAd: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/ads/${id}`);
    },
};
