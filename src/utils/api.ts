import { IAuthTokens, TokenRefreshRequest, applyAuthTokenInterceptor } from 'axios-jwt'
import axios, { AxiosInstance } from 'axios'

const BASE_URL = 'http://localhost:8000'//'http://ec2-13-232-100-141.ap-south-1.compute.amazonaws.com:8000'


export class Axios {
  private static instance: Axios;
  public axiosInstance: AxiosInstance
  private constructor() { 
    this.axiosInstance = axios.create({ baseURL: BASE_URL })
    applyAuthTokenInterceptor(this.axiosInstance, { header: 'Authorization',
    headerPrefix:'Bearer ',requestRefresh }) 
  }
  public static getInstance(): Axios {
    if (!Axios.instance) {
        Axios.instance = new Axios();
    }
    return Axios.instance;
}
}
// 1. Create an axios instance that you wish to apply the interceptor to
//export const axiosInstance = axios.create({ baseURL: BASE_URL })

// 2. Define token refresh function.
const requestRefresh: TokenRefreshRequest = async (refreshToken: string): Promise<IAuthTokens | string> => {

  // Important! Do NOT use the axios instance that you supplied to applyAuthTokenInterceptor (in our case 'axiosInstance')
  // because this will result in an infinite loop when trying to refresh the token.
  // Use the global axios client or a different instance
  //const response = await axios.post(`${BASE_URL}/wallet/refreshAccessToken`, { token: refreshToken })

  // If your backend supports rotating refresh tokens, you may also choose to return an object containing both tokens:
  // return {
  //  accessToken: response.data.access_token,
  //  refreshToken: response.data.refresh_token
  //}
  return refreshToken;
  //return response.data.access_token
}

// 3. Add interceptor to your axios instance
//applyAuthTokenInterceptor(axiosInstance, { requestRefresh })