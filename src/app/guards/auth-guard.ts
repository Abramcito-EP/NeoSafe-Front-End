import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('AuthGuard: Verificando autenticación para:', state.url);
  const isLoggedIn = authService.isLoggedIn();
  console.log('AuthGuard: Usuario está logueado?', isLoggedIn);
  
  if (isLoggedIn) {
    console.log('AuthGuard: Acceso permitido a:', state.url);
    return true;
  }
  
  console.log('AuthGuard: Acceso denegado, redirigiendo a login desde:', state.url);
  
  // Evitar bucles de redirección
  if (state.url === '/login' || state.url === '/register') {
    console.log('AuthGuard: Ya está en página de auth, no redirigir');
    return false;
  }
  
  // Redirigir a login
  router.navigate(['/login']);
  return false;
};