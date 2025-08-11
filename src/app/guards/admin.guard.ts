import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!currentUser || currentUser.role?.name !== 'admin') {
    // Redirigir a una página de acceso denegado o al inicio
    router.navigate(['/']);
    alert('Acceso denegado. Solo los administradores pueden acceder a esta sección.');
    return false;
  }

  return true;
};
