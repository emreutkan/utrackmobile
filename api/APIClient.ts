import axios from 'axios';
import { API_URL } from './ApiBase';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,

    withCredentials: true,
});

export default apiClient;

