import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { AuthService } from '../../services/auth';

interface NewProviderData {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class ProveedoresComponent implements OnInit {
  showAddProviderModal: boolean = false;
  isCreating: boolean = false;
  
  newProvider: NewProviderData = {
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    password: '123456'
  };

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
    
    this.showAddProviderModal = true;
    this.resetNewProviderForm();
  }

  closeAddProviderModal() {
    this.showAddProviderModal = false;
    this.resetNewProviderForm();
    this.isCreating = false;
  }

  private resetNewProviderForm() {
    this.newProvider = {
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      password: '123456'
    };
  }

  async createProvider() {
    if (!this.validateForm()) {
      return;
    }

    this.isCreating = true;

    try {
      // Simular creación del proveedor (aquí iría la llamada a la API real)
      console.log('🔄 Creando proveedor:', this.newProvider);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular respuesta exitosa
      console.log('✅ Proveedor creado exitosamente');
      alert(`¡Proveedor creado exitosamente!\nNombre: ${this.newProvider.firstName} ${this.newProvider.lastName}\nEmail: ${this.newProvider.email}`);
      
      this.closeAddProviderModal();
      
    } catch (error: any) {
      console.error('❌ Error al crear proveedor:', error);
      alert('Error al crear el proveedor. Intenta nuevamente.');
    } finally {
      this.isCreating = false;
    }
  }

  private validateForm(): boolean {
    const { firstName, lastName, birthDate, email, password } = this.newProvider;
    
    if (!firstName.trim()) {
      alert('El nombre es requerido');
      return false;
    }
    
    if (!lastName.trim()) {
      alert('El apellido es requerido');
      return false;
    }
    
    if (!birthDate) {
      alert('La fecha de nacimiento es requerida');
      return false;
    }
    
    if (!email.trim()) {
      alert('El correo electrónico es requerido');
      return false;
    }
    
    if (!this.isValidEmail(email)) {
      alert('Ingresa un correo electrónico válido');
      return false;
    }
    
    if (!password || password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role?.name === 'admin';
  }

  // Método para formatear la fecha al formato correcto del input date
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // Método para manejar cambios en la fecha
  onDateChange(event: any) {
    this.newProvider.birthDate = event.target.value;
  }
}