import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('AuthGuard: Verificando autenticación...');
  const isLoggedIn = authService.isLoggedIn();
  console.log('AuthGuard: Usuario está logueado?', isLoggedIn);
  
  if (isLoggedIn) {
    console.log('AuthGuard: Acceso permitido');
    return true;
  }
  
  console.log('AuthGuard: Acceso denegado, redirigiendo a login');
  // Redirigir al login si no está autenticado
  return router.parseUrl('/login');
};