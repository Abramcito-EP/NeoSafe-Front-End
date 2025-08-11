import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { User, AuthResponse, LoginData, RegisterData } from '../models/user.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  updateCurrentUser(user: any) {
    throw new Error('Method not implemented.');
  }
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromLocalStorage());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  login(loginData: LoginData): Observable<AuthResponse> {
    console.log('Intentando hacer login con:', loginData);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, loginData)
      .pipe(
        tap(response => {
          console.log('Login exitoso, respuesta del servidor:', response);
          this.setSession(response);
          console.log('Sesión establecida, usuario actual:', this.currentUserSubject.value);
        })
      );
  }

  register(registerData: RegisterData): Observable<any> {
    console.log('🚀 AuthService: Iniciando registro...');
    console.log('📦 AuthService: Datos recibidos:', registerData);
    console.log('🌐 AuthService: Environment apiUrl:', environment.apiUrl);
    console.log('🔗 AuthService: URL completa:', `${environment.apiUrl}/auth/register`);
    
    // Verificar que los datos requeridos estén presentes
    console.log('✅ AuthService: Verificaciones previas:');
    console.log('  - Nombre:', registerData.name ? '✅' : '❌');
    console.log('  - Apellido:', registerData.lastName ? '✅' : '❌');
    console.log('  - Email:', registerData.email ? '✅' : '❌');
    console.log('  - Password:', registerData.password ? '✅' : '❌');
    console.log('  - Fecha nacimiento:', registerData.birthDate ? '✅' : '⚠️ (opcional)');
    
    // Verificar si hay token en localStorage (para debugging del interceptor)
    const currentToken = localStorage.getItem('auth_token');
    console.log('🔑 AuthService: Token actual en localStorage:', currentToken ? 'Existe' : 'No existe');
    
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, registerData)
      .pipe(
        tap(response => {
          console.log('✅ AuthService: Registro exitoso!');
          console.log('📤 AuthService: Respuesta del servidor:', response);
        }),
        catchError(error => {
          console.error('❌ AuthService: Error en registro:');
          console.error('  - Status:', error.status);
          console.error('  - StatusText:', error.statusText);
          console.error('  - URL:', error.url);
          console.error('  - Error body:', error.error);
          console.error('  - Headers:', error.headers);
          console.error('  - Error completo:', error);
          
          // Re-lanzar el error para que el componente lo pueda manejar
          throw error;
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    console.log('isLoggedIn: Token encontrado?', !!token);
    console.log('isLoggedIn: Usuario encontrado?', !!user);
    
    // Para tokens OAT de AdonisJS, solo verificamos que existan
    return !!(token && user);
  }

  // Alias para compatibilidad
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  // Método getToken actualizado para usar 'auth_token'
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    return localStorage.getItem('auth_token');
  }

  // Método setToken para usar 'auth_token'
  setToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    console.log('🔑 AuthService: Guardando token:', token.substring(0, 20) + '...');
    localStorage.setItem('auth_token', token);
    console.log('🔑 AuthService: Token guardado en localStorage con clave auth_token');
  }

  // Método removeToken para usar 'auth_token'
  removeToken(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    console.log('🔑 AuthService: Eliminando token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // Método para debugging
  debugTokenInfo(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🔍 DEBUG - No estamos en navegador');
      return;
    }
    
    const token = this.getToken();
    console.log('🔍 DEBUG - Token info:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token preview:', token ? token.substring(0, 30) + '...' : 'null');
    console.log('  - localStorage auth_token:', localStorage.getItem('auth_token') ? 'exists' : 'null');
    console.log('  - localStorage user:', localStorage.getItem('user') ? 'exists' : 'null');
  }

  // Método para obtener el usuario actual (útil para otros servicios)
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Método público para limpiar la sesión
  clearSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    console.log('Sesión limpiada localmente');
  }

  private setSession(authResult: AuthResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    localStorage.setItem('auth_token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  private getUserFromLocalStorage(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    const userJson = localStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }
}