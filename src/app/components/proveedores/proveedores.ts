import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class ProveedoresComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Verificación adicional de seguridad
    this.verifyAdminAccess();
  }

  private verifyAdminAccess() {
    const currentUser = this.authService.getCurrentUser();
    
    if (!this.authService.isAuthenticated() || !currentUser || currentUser.role?.name !== 'admin') {
      console.warn('Acceso no autorizado a la sección de proveedores');
      this.router.navigate(['/']);
      return;
    }
  }

  openAddProviderModal() {
    // Verificar permisos antes de abrir el modal
    if (!this.isAdmin()) {
      alert('No tienes permisos para realizar esta acción');
      return;
    }
    
    console.log('Abrir modal para agregar proveedor');
    // Aquí se implementará la lógica para abrir el modal de agregar proveedor
  }

  private isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role?.name === 'admin';
  }
}
