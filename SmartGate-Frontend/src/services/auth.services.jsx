import { useApiClient } from "./api"

export const useAuthServices = (token) => {
    const {api} = useApiClient(token)

    const login = (email, password) => {
        return api.post('/api/auth/login',{email, password})
    }

    return {
        login
    }
}