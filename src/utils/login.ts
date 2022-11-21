import { isLoggedIn, setAuthTokens, clearAuthTokens, getAccessToken, getRefreshToken } from 'axios-jwt'
import { axiosInstance } from './api'

// 4. Post email and password and get tokens in return. Call setAuthTokens with the result.
const login = async (params: any) => {
  const response = await axiosInstance.post('/auth/login', params)

  // save tokens to storage
  setAuthTokens({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token
  })
}

// 5. Remove the auth tokens from storage
const logout = () => clearAuthTokens()

// Check if refresh token exists
if (isLoggedIn()) {
  // assume we are logged in because we have a refresh token
}

// Get access to tokens
const accessToken = getAccessToken()
const refreshToken = getRefreshToken()