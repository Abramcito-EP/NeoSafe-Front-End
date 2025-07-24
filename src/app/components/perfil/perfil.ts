import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../shared/sidebar/sidebar";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  avatar?: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  showOnlineStatus: boolean;
}

@Component({
  selector: 'app-perfil',
  imports: [SidebarComponent, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
changeAvatar() {
throw new Error('Method not implemented.');
}
  profileForm: FormGroup;
  isEditing = false;
  
  userProfile: UserProfile = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    phone: '+1234567890',
    birthDate: '1990-01-01',
    gender: 'masculino',
    avatar: ''
  };

  securitySettings: SecuritySettings = {
    twoFactorEnabled: false
  };

  notificationSettings: NotificationSettings = {
    email: true,
    push: true,
    marketing: false
  };

  privacySettings: PrivacySettings = {
    publicProfile: true,
    showOnlineStatus: true
  };

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      birthDate: [''],
      gender: ['']
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.profileForm.patchValue(this.userProfile);
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadUserProfile(); // Recargar datos originales
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.loadUserProfile();
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.userProfile = { ...this.userProfile, ...this.profileForm.value };
      console.log('Perfil actualizado:', this.userProfile);
      // Aquí iría la llamada al servicio para guardar los datos
      this.isEditing = false;
    }
  }

  openChangePasswordModal() {
    console.log('Abrir modal de cambio de contraseña');
    // Implementar lógica para abrir modal
  }

  toggleTwoFactor() {
    console.log('Toggle 2FA:', this.securitySettings.twoFactorEnabled);
    // Implementar lógica para activar/desactivar 2FA
  }

  viewActiveSessions() {
    console.log('Ver sesiones activas');
    // Implementar lógica para mostrar sesiones activas
  }

  deactivateAccount() {
    if (confirm('¿Estás seguro de que quieres desactivar tu cuenta?')) {
      console.log('Desactivar cuenta');
      // Implementar lógica para desactivar cuenta
    }
  }

  deleteAccount() {
    if (confirm('¿Estás seguro de que quieres eliminar permanentemente tu cuenta? Esta acción no se puede deshacer.')) {
      console.log('Eliminar cuenta');
      // Implementar lógica para eliminar cuenta
    }
  }
}
