// src/services/apiService.ts

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiService {
  private baseUrl: string;
  private defaultTimeout = 10000;
  private defaultRetries = 3;
  private defaultRetryDelay = 1000;

  constructor(baseUrl: string = '') {
    // ✅ Use env variable or fallback
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    requestOptions: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
    } = requestOptions;

    const fullUrl = `${this.baseUrl}${url}`;
    let lastError: Error;

    // ✅ Inject Authorization token if present
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          fullUrl,
          { ...options, headers },
          timeout
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        return {
          data,
          status: response.status,
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // exponential backoff
        }
      }
    }

    return {
      error: lastError?.message || "Request failed",
      status: 0,
    };
  }

  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'GET' }, options);
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );
  }

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'DELETE' }, options);
  }
}

// ✅ Create main backend API instance
export const backendApi = new ApiService(import.meta.env.VITE_API_URL || "http://localhost:5000/api");

// ==================== Device Helpers ====================
export interface Device {
  _id?: string;
  name: string;
  type: "laptop" | "smartphone" | "tv" | "other";
  ip: string;
  mac: string;
  status: "online" | "offline";
  lastSeen: string;
  bandwidth: number;
  owner?: string;
  isGuest?: boolean;
}

// ✅ Fetch all devices
export const getDevices = async (): Promise<ApiResponse<Device[]>> => {
  return backendApi.get<Device[]>('/devices');
};

// ✅ Create a new device
export const createDevice = async (device: Omit<Device, '_id'>): Promise<ApiResponse<Device>> => {
  return backendApi.post<Device>('/devices', device);
};

export default ApiService;
