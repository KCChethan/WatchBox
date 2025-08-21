import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private static TOKEN_KEY = 'device_monitor_token';
  private static USER_KEY = 'device_monitor_user';
  private static USERS_KEY = 'device_monitor_users';

  // Get stored token
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get stored user
  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Check if token is expired
  private static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // Get stored users (for local authentication)
  private static getStoredUsers(): { [key: string]: { password: string; email?: string; createdAt: string } } {
    const usersStr = localStorage.getItem(this.USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : {};
  }

  // Store users locally
  private static storeUsers(users: { [key: string]: { password: string; email?: string; createdAt: string } }): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Generate a simple token
  private static generateToken(username: string): string {
    const payload = {
      username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };
    return btoa(JSON.stringify(payload));
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // First try the API endpoint
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        return data;
      }
    } catch (error) {
      // If API fails, try local authentication
      const users = this.getStoredUsers();
      const user = users[credentials.username];
      
      if (user && user.password === credentials.password) {
        const userData: User = {
          id: credentials.username,
          username: credentials.username,
          email: user.email,
          createdAt: user.createdAt
        };
        
        const token = this.generateToken(credentials.username);
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        
        return {
          user: userData,
          token
        };
      } else {
        throw new Error('Invalid username or password');
      }
    }
    
    throw new Error('Login failed. Please check your credentials.');
  }

  // Signup user
  static async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      // First try the API endpoint
      const response = await apiRequest('POST', '/api/auth/signup', credentials);
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        return data;
      }
    } catch (error) {
      // If API fails, create local user
      const users = this.getStoredUsers();
      
      if (users[credentials.username]) {
        throw new Error('Username already exists');
      }
      
      // Create new user locally
      users[credentials.username] = {
        password: credentials.password,
        email: credentials.email,
        createdAt: new Date().toISOString()
      };
      
      this.storeUsers(users);
      
      const userData: User = {
        id: credentials.username,
        username: credentials.username,
        email: credentials.email,
        createdAt: users[credentials.username].createdAt
      };
      
      const token = this.generateToken(credentials.username);
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      
      return {
        user: userData,
        token
      };
    }
    
    throw new Error('Signup failed. Please try again.');
  }

  // Logout user
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Refresh token
  static async refreshToken(): Promise<string | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await apiRequest('POST', '/api/auth/refresh', { token });
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem(this.TOKEN_KEY, data.token);
        return data.token;
      }
    } catch {
      // If refresh fails, logout user
      this.logout();
    }
    return null;
  }

  // Get authenticated headers for API requests
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate username
  static validateUsername(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 20) {
      errors.push('Username must be less than 20 characters');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AuthService;
