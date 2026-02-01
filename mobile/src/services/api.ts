// API service layer

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  SubmitOnboardingRequest,
  SubmitOnboardingResponse,
  User,
  VerificationStatus,
  ApiError,
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
    config: InternalAxiosRequestConfig;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Token will be added by the auth store
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling with refresh-then-retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
          _skipRefresh?: boolean;
        };

        // Handle 401 errors globally
        if (error.response?.status === 401 && originalRequest) {
          // Check if it's a refresh endpoint - don't retry refresh failures
          const isRefreshEndpoint = originalRequest.url?.includes('/refresh');
          if (isRefreshEndpoint) {
            // Refresh failed, logout and redirect
            const { useAuthStore } = await import('../store/authStore');
            const authStore = useAuthStore.getState();
            await authStore.logout();
            authStore.clearError();
            // Set expired status with clear message
            useAuthStore.setState({
              status: 'expired',
              error: 'Your session has expired. Please login again.',
            });
            return Promise.reject(error);
          }

          // Skip refresh if this request already attempted refresh
          if (originalRequest._skipRefresh) {
            return Promise.reject(error);
          }

          // If we're already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            })
              .then(() => {
                // Retry the original request with new token
                // Mark to skip refresh to avoid infinite loops
                originalRequest._skipRefresh = true;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          // Mark that we're attempting refresh for this request
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt refresh once
            const { useAuthStore } = await import('../store/authStore');
            const authStore = useAuthStore.getState();
            const refreshToken = authStore.session?.refreshToken;

            if (!refreshToken) {
              // No refresh token, logout immediately
              await authStore.logout();
              useAuthStore.setState({
                status: 'expired',
                error: 'Your session has expired. Please login again.',
              });
              this.processQueue(null);
              return Promise.reject(error);
            }

            // Attempt refresh
            await authStore.refreshSession();

            // Check if refresh was successful
            const newAuthState = useAuthStore.getState();
            if (newAuthState.status === 'expired' || !newAuthState.session) {
              // Refresh failed, logout already handled in refreshSession
              this.processQueue(null);
              return Promise.reject(error);
            }

            // Update token in API client
            this.setAuthToken(newAuthState.session.accessToken);

            // Process queued requests
            this.processQueue(null);

            // Retry original request once
            // Mark to skip refresh to avoid infinite loops
            originalRequest._skipRefresh = true;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout and redirect
            const { useAuthStore } = await import('../store/authStore');
            const authStore = useAuthStore.getState();
            await authStore.logout();
            useAuthStore.setState({
              status: 'expired',
              error: 'Your session has expired. Please login again.',
            });
            this.processQueue(refreshError);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((item) => {
      if (error) {
        item.reject(error);
      } else {
        // Mark config to skip refresh to avoid infinite loops
        const config = item.config as InternalAxiosRequestConfig & {
          _skipRefresh?: boolean;
        };
        config._skipRefresh = true;
        item.resolve();
      }
    });
    this.failedQueue = [];
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await this.client.post<RefreshResponse>(
      API_ENDPOINTS.REFRESH,
      { refreshToken }
    );
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>(API_ENDPOINTS.ME);
    return response.data;
  }

  async submitOnboarding(
    request: SubmitOnboardingRequest
  ): Promise<SubmitOnboardingResponse> {
    const response = await this.client.post<SubmitOnboardingResponse>(
      API_ENDPOINTS.SUBMIT_ONBOARDING,
      request
    );
    return response.data;
  }

  async getVerificationStatus(): Promise<VerificationStatus> {
    const response = await this.client.get<VerificationStatus>(
      API_ENDPOINTS.VERIFICATION_STATUS
    );
    return response.data;
  }
}

export const apiService = new ApiService();
