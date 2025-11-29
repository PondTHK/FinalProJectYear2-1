import { apiCall, ApiResponse } from './api';

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

export const adsAPI = {
    getAds: async (): Promise<ApiResponse<Ad[]>> => {
        return apiCall<Ad[]>('/api/ads', {
            method: 'GET',
        });
    },
};
