import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { AuthService } from '../../services/auth';
import { ProvidersService, Provider } from '../../services/providers.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  showProviderDetailsModal: boolean = false;
  showEditProviderModal: boolean = false;
  isCreating: boolean = false;
  isLoading: boolean = false;
  isUpdating: boolean = false;
  providers: Provider[] = [];
  selectedProvider: Provider | null = null;
  
  newProvider: NewProviderData = {
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    password: '123456'
  };

  editProviderData: NewProviderData = {
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    password: ''
  };

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly providersService: ProvidersService
  ) { }

  ngOnInit() {
    // Verificación adicional de seguridad
    this.verifyAdminAccess();
    // Cargar la lista de proveedores
    this.loadProviders();
  }

  private verifyAdminAccess() {
    const currentUser = this.authService.getCurrentUser();
    
    if (!this.authService.isAuthenticated() || !currentUser || currentUser.role?.name !== 'admin') {
      console.warn('Acceso no autorizado a la sección de proveedores');
      this.router.navigate(['/']);
    }
  }

  /**
   * Cargar la lista de proveedores desde el servidor
   */
  loadProviders() {
    this.isLoading = true;
    
    this.providersService.getAllProviders().subscribe({
      next: (response) => {
        console.log('✅ Proveedores cargados:', response);
        this.providers = response.providers;
      },
      error: (error) => {
        console.error('❌ Error al cargar proveedores:', error);
        this.snackBar.open('Error al cargar la lista de proveedores', 'Cerrar', {
          duration: 3000
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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
      // Preparar los datos para el registro como usuario
      const registerData = {
        name: this.newProvider.firstName,
        lastName: this.newProvider.lastName,
        birthDate: this.formatDateForBackend(this.newProvider.birthDate),
        email: this.newProvider.email,
        password: this.newProvider.password,
        roleId: 2 // Rol de proveedor
      };

      console.log('🔄 Registrando proveedor como usuario:', registerData);
      
      // Llamar al servicio de autenticación para registrar al proveedor como usuario
      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('✅ Proveedor registrado exitosamente:', response);
          this.snackBar.open(`¡Proveedor ${this.newProvider.firstName} ${this.newProvider.lastName} registrado exitosamente!`, 'Cerrar', {
            duration: 4000
          });
          this.closeAddProviderModal();
          // Recargar la lista de proveedores
          this.loadProviders();
        },
        error: (error) => {
          console.error('❌ Error al registrar proveedor:', error);
          let errorMessage = 'Error al registrar el proveedor. Intenta nuevamente.';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            // Si hay errores de validación específicos
            if (Array.isArray(error.error.errors)) {
              errorMessage = error.error.errors.map((err: any) => err.message || err).join(', ');
            } else {
              errorMessage = error.error.errors;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000
          });
        }
      });
      
    } catch (error: any) {
      console.error('❌ Error al crear proveedor:', error);
      alert('Error al crear el proveedor. Intenta nuevamente.');
    } finally {
      this.isCreating = false;
    }
  }

  private formatDateForBackend(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateString);
      return '';
    }
    
    // Validar que el año esté en un rango razonable
    const year = date.getFullYear();
    if (year < 1900 || year > 2010) {
      console.error('Año fuera de rango válido:', year);
      return '';
    }
    
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0') + ' 00:00:00';
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
    
    // Validar que la fecha sea válida
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      alert('La fecha de nacimiento no es válida');
      return false;
    }
    
    // Validar que el año esté en un rango razonable
    const year = date.getFullYear();
    if (year < 1900 || year > 2010) {
      alert('El año de nacimiento debe estar entre 1900 y 2010');
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

  /**
   * Formatear fecha para mostrar en la interfaz
   */
  formatDisplayDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtener las iniciales del proveedor para el avatar
   */
  getProviderInitials(provider: Provider): string {
    return `${provider.name.charAt(0)}${provider.lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Calcular la edad del proveedor
   */
  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Ver detalles del proveedor
   */
  viewProviderDetails(provider: Provider) {
    console.log('👁️ Viendo detalles del proveedor:', provider);
    this.selectedProvider = provider;
    this.showProviderDetailsModal = true;
  }

  /**
   * Editar proveedor
   */
  editProvider(provider: Provider) {
    console.log('✏️ Editando proveedor:', provider);
    this.selectedProvider = provider;
    
    // Llenar el formulario con los datos del proveedor
    this.editProviderData = {
      firstName: provider.name,
      lastName: provider.lastName,
      birthDate: this.formatDateForInput(provider.birthDate),
      email: provider.email,
      password: ''
    };
    
    this.showEditProviderModal = true;
  }

  /**
   * Eliminar proveedor
   */
  deleteProvider(provider: Provider) {
    console.log('🗑️ Eliminando proveedor:', provider);
    
    const confirmDelete = confirm(
      `¿Estás seguro de que deseas eliminar al proveedor "${provider.name} ${provider.lastName}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );
    
    if (confirmDelete) {
      this.providersService.deleteProvider(provider.id).subscribe({
        next: (response) => {
          console.log('✅ Proveedor eliminado:', response);
          this.snackBar.open(response.message, 'Cerrar', {
            duration: 4000
          });
          // Recargar la lista de proveedores
          this.loadProviders();
        },
        error: (error) => {
          console.error('❌ Error al eliminar proveedor:', error);
          let errorMessage = 'Error al eliminar el proveedor';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000
          });
        }
      });
    }
  }

  /**
   * Cerrar modal de detalles
   */
  closeProviderDetailsModal() {
    this.showProviderDetailsModal = false;
    this.selectedProvider = null;
  }

  /**
   * Cerrar modal de edición
   */
  closeEditProviderModal() {
    this.showEditProviderModal = false;
    this.selectedProvider = null;
    this.resetEditProviderForm();
    this.isUpdating = false;
  }

  /**
   * Resetear formulario de edición
   */
  private resetEditProviderForm() {
    this.editProviderData = {
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      password: ''
    };
  }

  /**
   * Actualizar proveedor
   */
  async updateProvider() {
    if (!this.selectedProvider) return;
    
    if (!this.validateEditForm()) {
      return;
    }

    this.isUpdating = true;

    try {
      const updateData = {
        name: this.editProviderData.firstName,
        lastName: this.editProviderData.lastName,
        email: this.editProviderData.email,
        birthDate: this.formatDateForBackend(this.editProviderData.birthDate)
      };

      console.log('🔄 Actualizando proveedor:', {
        id: this.selectedProvider.id,
        data: updateData
      });
      
      this.providersService.updateProvider(this.selectedProvider.id, updateData).subscribe({
        next: (response) => {
          console.log('✅ Proveedor actualizado:', response);
          this.snackBar.open(response.message, 'Cerrar', {
            duration: 4000
          });
          this.closeEditProviderModal();
          // Recargar la lista de proveedores
          this.loadProviders();
        },
        error: (error) => {
          console.error('❌ Error al actualizar proveedor:', error);
          let errorMessage = 'Error al actualizar el proveedor';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            if (Array.isArray(error.error.errors)) {
              errorMessage = error.error.errors.map((err: any) => err.message || err).join(', ');
            } else {
              errorMessage = error.error.errors;
            }
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000
          });
        },
        complete: () => {
          this.isUpdating = false;
        }
      });
      
    } catch (error: any) {
      console.error('❌ Error al actualizar proveedor:', error);
      this.snackBar.open('Error al actualizar el proveedor. Intenta nuevamente.', 'Cerrar', {
        duration: 3000
      });
      this.isUpdating = false;
    }
  }

  /**
   * Validar formulario de edición
   */
  private validateEditForm(): boolean {
    const { firstName, lastName, birthDate, email } = this.editProviderData;
    
    if (!firstName.trim()) {
      this.snackBar.open('El nombre es requerido', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    if (!lastName.trim()) {
      this.snackBar.open('El apellido es requerido', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    if (!birthDate) {
      this.snackBar.open('La fecha de nacimiento es requerida', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    if (!email.trim()) {
      this.snackBar.open('El correo electrónico es requerido', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    if (!this.isValidEmail(email)) {
      this.snackBar.open('Ingresa un correo electrónico válido', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    // Validar que la fecha sea válida
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      this.snackBar.open('La fecha de nacimiento no es válida', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    // Validar que el año esté en un rango razonable
    const year = date.getFullYear();
    if (year < 1900 || year > 2010) {
      this.snackBar.open('El año de nacimiento debe estar entre 1900 y 2010', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    return true;
  }
}