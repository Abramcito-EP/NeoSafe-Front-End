import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('🔄 AuthInterceptor: Interceptando petición:', request.url);
    console.log('🔄 AuthInterceptor: Método:', request.method);
    
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🔄 AuthInterceptor: No es navegador, pasando sin modificar');
      return next.handle(request);
    }
    
    // Buscar el token con la clave correcta 'auth_token'
    const token = localStorage.getItem('auth_token');
    console.log('🔄 AuthInterceptor: Token encontrado?', !!token);
    console.log('🔄 AuthInterceptor: Token (primeros 30 chars):', token ? token.substring(0, 30) + '...' : 'null');
    
    let cloned = request;
    
    if (token) {
      console.log('🔄 AuthInterceptor: Agregando token a headers');
      cloned = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('🔄 AuthInterceptor: Authorization header agregado:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('🔄 AuthInterceptor: No hay token, pasando petición sin modificar');
    }
    
    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🔥 AuthInterceptor: Error en petición:', error);
        console.error('🔥 AuthInterceptor: Error status:', error.status);
        console.error('🔥 AuthInterceptor: Error message:', error.message);
        console.error('🔥 AuthInterceptor: Error body:', error.error);
        
        if (error.status === 401) {
          console.warn('🔥 AuthInterceptor: Error 401 - Token inválido o expirado');
          // Limpiar token inválido
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          
          // Redirigir al login solo si no estamos ya en una ruta de auth
          if (!this.router.url.includes('/auth')) {
            console.log('🔥 AuthInterceptor: Redirigiendo al login');
            this.router.navigate(['/auth/login']);
          }
        }
        
        if (error.status === 403) {
          console.warn('🔥 AuthInterceptor: Error 403 - Sin permisos');
          console.warn('🔥 AuthInterceptor: Verificar rol del usuario');
        }
        
        return throwError(() => error);
      })
    );
  }
}