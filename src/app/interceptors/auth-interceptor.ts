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
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = Inject(AuthService);
  private router = Inject(Router);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('🔄 AuthInterceptor: Interceptando petición:', request.url);
    console.log('🔄 AuthInterceptor: Método:', request.method);

    // Identificar si es una petición de login o registro
    const isAuthRequest = request.url.includes('/auth/login') || request.url.includes('/auth/register');
    
    let authReq = request;
    const token = this.authService.getToken();
    
    console.log('🔄 AuthInterceptor: Token encontrado?', !!token);
    console.log('🔄 AuthInterceptor: Token (primeros 30 chars):', token ? token.substring(0, 30) + '...' : 'null');
    console.log('🔄 AuthInterceptor: Es petición de auth?', isAuthRequest);
    
    if (token && !isAuthRequest) {
      console.log('🔄 AuthInterceptor: Agregando token a headers');
      authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('🔄 AuthInterceptor: Authorization header agregado:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('🔄 AuthInterceptor: No hay token o es petición de auth, pasando petición sin modificar');
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('🔥 AuthInterceptor: Error en petición:', error);
        console.log('🔥 AuthInterceptor: Error status:', error.status);
        console.log('🔥 AuthInterceptor: Error message:', error.message);
        console.log('🔥 AuthInterceptor: Error body:', error.error);
        console.log('🔥 AuthInterceptor: URL de la petición:', error.url);
        
        // Solo manejar errores 401 para peticiones que NO son de login/registro
        if (error.status === 401 && !isAuthRequest) {
          console.log('🔥 AuthInterceptor: Error 401 en petición protegida - Token inválido o expirado');
          console.log('🔥 AuthInterceptor: Limpiando sesión y redirigiendo al login');
          
          // Limpiar tokens y sesión
          this.authService.clearSession();
          
          // Redirigir al login solo si no estamos ya en login
          const currentUrl = this.router.url;
          if (currentUrl !== '/login' && currentUrl !== '/register') {
            console.log('🔄 AuthInterceptor: Redirigiendo al login desde:', currentUrl);
            this.router.navigate(['/login']);
          }
        } else if (error.status === 401 && isAuthRequest) {
          console.log('🔥 AuthInterceptor: Error 401 en login/registro - Credenciales incorrectas');
          console.log('🔥 AuthInterceptor: NO redirigiendo, dejando que el componente maneje el error');
        }
        
        return throwError(() => error);
      }),
      finalize(() => {
        // Cleanup si es necesario
      })
    );
  }
}