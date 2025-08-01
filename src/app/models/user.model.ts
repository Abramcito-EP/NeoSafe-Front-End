export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  birthDate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  birthDate?: string; // Siempre string en formato "YYYY-MM-DD HH:mm:ss"
}