import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login').then(c => c.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/auth/register/register').then(c => c.RegisterComponent)
  },
  {
    path:'cajas',
    loadComponent: () => import('./components/cajas/cajas').then(c => c.CajasComponent),
    canActivate: [authGuard]
  },
  {
    path:'estadisticas',
    loadComponent: () => import('./components/estadisticas/estadisticas').then(c => c.EstadisticasComponent),
    canActivate: [authGuard]
  },
  {
    path:'perfil',
    loadComponent: () => import('./components/perfil/perfil').then(c => c.PerfilComponent),
    canActivate: [authGuard]
  },
  {
    path:'proveedores',
    loadComponent: () => import('./components/proveedores/proveedores').then(c => c.ProveedoresComponent),
    canActivate: [authGuard, adminGuard]
  },
  { 
    path: '', 
    loadComponent: () => import('./components/home/home').then(c => c.HomeComponent)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

