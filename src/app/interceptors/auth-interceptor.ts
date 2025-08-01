import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('🔄 AuthInterceptor: Interceptando petición:', request.url);
    console.log('🔄 AuthInterceptor: Método:', request.method);
    console.log('🔄 AuthInterceptor: Headers originales:', request.headers.keys());
    
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🔄 AuthInterceptor: No es navegador, pasando sin modificar');
      return next.handle(request);
    }
    
    const token = localStorage.getItem('token');
    console.log('🔄 AuthInterceptor: Token encontrado?', !!token);
    
    if (token) {
      console.log('🔄 AuthInterceptor: Agregando token a headers');
      const cloned = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('🔄 AuthInterceptor: Headers después de agregar token:', cloned.headers.keys());
      return next.handle(cloned);
    }
    
    console.log('🔄 AuthInterceptor: No hay token, pasando petición sin modificar');
    return next.handle(request);
  }
}