

import axios from 'axios'

const baseURL = 'http://localhost:3001';

export const useApiClient = (token) => {


    const api = axios.create({
        baseURL,
        headers: {
            'Content-Type' : 'application/json'
        }
    })

    api.interceptors.request.use(request => {
       if (token) {
        request.headers.Authorization = `Bearer ${token}`
       }
       return request
    })

    return {api}

}