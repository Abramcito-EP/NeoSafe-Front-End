import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔄 AuthInterceptor: Interceptando petición:', req.url);
    console.log('🔄 AuthInterceptor: Método:', req.method);

    // Identificar si es una petición de login o registro
    const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');
    
    let authReq = req;
    
    // Verificar que authService esté disponible antes de usar getToken
    let token: string | null = null;
    
    try {
      if (this.authService && typeof this.authService.getToken === 'function') {
        token = this.authService.getToken();
      } else {
        console.warn('🔄 AuthInterceptor: AuthService no disponible o getToken no es función');
        token = null;
      }
    } catch (error) {
      console.error('🔄 AuthInterceptor: Error obteniendo token:', error);
      token = null;
    }
    
    console.log('🔄 AuthInterceptor: Token encontrado?', !!token);
    console.log('🔄 AuthInterceptor: Token (primeros 30 chars):', token ? token.substring(0, 30) + '...' : 'null');
    console.log('🔄 AuthInterceptor: Es petición de auth?', isAuthRequest);
    
    if (token && !isAuthRequest) {
      console.log('🔄 AuthInterceptor: Agregando token a headers');
      authReq = req.clone({
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
          
          // Limpiar tokens y sesión solo si authService está disponible
          if (this.authService && typeof this.authService.clearSession === 'function') {
            this.authService.clearSession();
          }
          
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