import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse, LoginData, RegisterData } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, registerData);
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
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('isLoggedIn: Token encontrado?', !!token);
    console.log('isLoggedIn: Usuario encontrado?', !!user);
    
    // Para tokens OAT de AdonisJS, solo verificamos que existan
    return !!(token && user);
  }

  // Método getToken agregado
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    return localStorage.getItem('token');
  }

  // Método para obtener el usuario actual (útil para otros servicios)
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setSession(authResult: AuthResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  private clearSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
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