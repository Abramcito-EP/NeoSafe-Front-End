import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

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
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard').then(c => c.DashboardComponent),
    canActivate: [authGuard]
    
  },
  {
    path:'cajas',
    loadComponent: () => import('./components/dashboard/cajas/cajas').then(c => c.CajasComponent),
    canActivate: [authGuard]
  },
  {
    path:'estadisticas',
    loadComponent: () => import('./components/dashboard/estadisticas/estadisticas').then(c => c.EstadisticasComponent),
    canActivate: [authGuard]
  },
  {
    path:'perfil',
    loadComponent: () => import('./components/perfil/perfil').then(c => c.PerfilComponent),
    canActivate: [authGuard]
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

