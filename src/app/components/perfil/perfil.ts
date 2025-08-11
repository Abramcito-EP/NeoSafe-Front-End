import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../shared/sidebar/sidebar";
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface UserProfile {
  name: string;
  lastName: string;
  email: string;
  birthDate: string;
}

@Component({
  selector: 'app-perfil',
  imports: [SidebarComponent, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditing = false;
  isLoading = false;
  showPasswordModal = false;
  
  userProfile: UserProfile = {
    name: '',
    lastName: '',
    email: '',
    birthDate: ''
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      birthDate: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/auth/perfil`).subscribe({
      next: (response) => {
        this.userProfile = {
          name: response.name,
          lastName: response.lastName,
          email: response.email,
          birthDate: response.birthDate?.split('T')[0] || ''
        };
        
        this.profileForm.patchValue({
          firstName: this.userProfile.name,
          lastName: this.userProfile.lastName,
          email: this.userProfile.email,
          birthDate: this.userProfile.birthDate
        });
        
        // Asegurar que los campos estén deshabilitados por defecto
        if (!this.isEditing) {
          this.profileForm.get('firstName')?.disable();
          this.profileForm.get('lastName')?.disable();
        }
        this.profileForm.get('email')?.disable();
        this.profileForm.get('birthDate')?.disable();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.profileForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      // Solo enviar name y lastName para actualización
      const updateData = {
        name: this.profileForm.get('firstName')?.value,
        lastName: this.profileForm.get('lastName')?.value
      };

      this.http.put<any>(`${environment.apiUrl}/auth/perfil`, updateData).subscribe({
        next: (response) => {
          console.log('Perfil actualizado exitosamente');
          this.userProfile = {
            name: response.user.name,
            lastName: response.user.lastName,
            email: response.user.email,
            birthDate: response.user.birthDate?.split('T')[0] || ''
          };
          this.isEditing = false;
          this.isLoading = false;
          
          // Actualizar el usuario en el servicio de autenticación
          this.authService.updateCurrentUser(response.user);
        },
        error: (error) => {
          console.error('Error al actualizar perfil:', error);
          this.isLoading = false;
        }
      });
    }
  }

  changeAvatar() {
    console.log('Cambiar avatar - función pendiente de implementar');
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      // Solo habilitar name y lastName para edición
      this.profileForm.get('firstName')?.enable();
      this.profileForm.get('lastName')?.enable();
      this.profileForm.get('email')?.disable();
      this.profileForm.get('birthDate')?.disable();
    } else {
      // Deshabilitar todos los campos cuando no se está editando
      this.profileForm.get('firstName')?.disable();
      this.profileForm.get('lastName')?.disable();
      this.profileForm.get('email')?.disable();
      this.profileForm.get('birthDate')?.disable();
      this.loadUserProfile();
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.profileForm.get('firstName')?.disable();
    this.profileForm.get('lastName')?.disable();
    this.profileForm.get('email')?.disable();
    this.profileForm.get('birthDate')?.disable();
    this.loadUserProfile();
  }

  openChangePasswordModal() {
    this.showPasswordModal = true;
    this.passwordForm.reset();
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.passwordForm.reset();
  }

  onPasswordSubmit() {
    if (this.passwordForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const passwordData = {
        currentPassword: this.passwordForm.value.currentPassword,
        password: this.passwordForm.value.password,
        password_confirmation: this.passwordForm.value.password_confirmation
      };

      this.http.put<any>(`${environment.apiUrl}/auth/perfil/password`, passwordData).subscribe({
        next: (response) => {
          console.log('Contraseña actualizada exitosamente');
          this.closePasswordModal();
          this.isLoading = false;
          alert('Contraseña actualizada correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar contraseña:', error);
          this.isLoading = false;
          alert('Error al actualizar contraseña: ' + (error.error?.message || 'Error desconocido'));
        }
      });
    }
  }

  deleteAccount() {
    if (confirm('¿Estás seguro de que quieres eliminar permanentemente tu cuenta? Esta acción no se puede deshacer.')) {
      console.log('Eliminar cuenta');
    }
  }
}

