import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Importar módulos de Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Solo verificar autenticación si no hay errores previos
    if (this.authService.isAuthenticated()) {
      console.log('Usuario ya está autenticado, redirigiendo...');
      this.router.navigate(['/']);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    console.log('🔑 Intentando login...');
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ Login exitoso:', response);
        
        if (response && response.token && response.user) {
          console.log('✅ Sesión establecida, redirigiendo...');
          
          this.snackBar.open('¡Bienvenido de vuelta!', 'Cerrar', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
          
          // Redirigir inmediatamente
          this.router.navigate(['/']);
        } else {
          console.error('❌ Respuesta de login inválida');
          this.errorMessage = 'Error en la respuesta del servidor. Intenta nuevamente.';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error en el login:', error);
        
        // Determinar mensaje de error específico
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.status === 401) {
          errorMessage = 'Correo electrónico o contraseña incorrectos';
        } else if (error.status === 404) {
          errorMessage = 'Usuario no encontrado';
        } else if (error.status === 422) {
          errorMessage = 'Datos de acceso inválidos';
        } else if (error.status === 500) {
          errorMessage = 'Error del servidor. Intenta más tarde';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.errorMessage = errorMessage;
        
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        
        console.log('❌ Usuario permanece en página de login');
      }
    });
  }

  onInputChange() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }
}