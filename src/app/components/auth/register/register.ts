import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

// Importar módulos de Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-register',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})
export class RegisterComponent {
  currentStep = 1;
  loading = false;
  hidePassword = true;

  // Formularios separados para cada paso
  step1Form: FormGroup;
  step2Form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Fecha por defecto: 1 de enero de 1990 (para usuarios que no especifiquen)
    const defaultBirthDate = new Date('1990-01-01');

    // Primer paso: Información personal
    this.step1Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: [defaultBirthDate] // Fecha por defecto
    });

    // Segundo paso: Credenciales
    this.step2Form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  nextStep() {
    if (this.step1Form.valid) {
      this.currentStep = 2;
    }
  }

  previousStep() {
    this.currentStep = 1;
  }

  onSubmit() {
    console.log('🚀 Frontend: Iniciando proceso de registro...');
    console.log('📋 Frontend: Validando formularios...');
    console.log('📋 Frontend: Step1 válido:', this.step1Form.valid);
    console.log('📋 Frontend: Step1 valores:', this.step1Form.value);
    console.log('📋 Frontend: Step2 válido:', this.step2Form.valid);
    console.log('📋 Frontend: Step2 valores:', this.step2Form.value);

    if (this.step2Form.invalid) {
      console.log('❌ Frontend: Formulario step2 inválido');
      console.log('❌ Frontend: Errores step2:', this.step2Form.errors);
      return;
    }

    if (this.step1Form.invalid) {
      console.log('❌ Frontend: Formulario step1 inválido');
      console.log('❌ Frontend: Errores step1:', this.step1Form.errors);
      return;
    }

    // Combinar ambos formularios
    const registerData = {
      ...this.step1Form.value,
      ...this.step2Form.value
    };

    console.log('📦 Frontend: Datos combinados antes de formatear:', registerData);
    console.log('📦 Frontend: Tipo de birthDate antes:', typeof registerData.birthDate);
    console.log('📦 Frontend: Valor de birthDate antes:', registerData.birthDate);

    // Formatear fecha de nacimiento al formato que espera el backend
    if (registerData.birthDate) {
      const date = new Date(registerData.birthDate);
      // Formato: "YYYY-MM-DD HH:mm:ss"
      const formattedDate = date.getFullYear() + '-' + 
                           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(date.getDate()).padStart(2, '0') + ' 00:00:00';
      
      registerData.birthDate = formattedDate;
      console.log('📅 Frontend: Fecha formateada:', registerData.birthDate);
    }

    console.log('📤 Frontend: Datos finales a enviar:', registerData);
    
    this.loading = true;
    console.log('⏳ Frontend: Iniciando petición HTTP...');
    
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('✅ Frontend: Respuesta exitosa recibida:', response);
        this.loading = false;
        this.snackBar.open('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión', 'Cerrar', {
          duration: 4000
        });
        console.log('🚀 Frontend: Navegando a login...');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Frontend: Error en la petición:', error);
        console.error('❌ Frontend: Error status:', error.status);
        console.error('❌ Frontend: Error statusText:', error.statusText);
        console.error('❌ Frontend: Error body:', error.error);
        console.error('❌ Frontend: Error completo:', JSON.stringify(error, null, 2));
        
        this.loading = false;
        const errorMessage = error.error?.message || error.message || 'Error al crear la cuenta';
        console.error('❌ Frontend: Mensaje de error a mostrar:', errorMessage);
        
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  getProgressPercentage(): number {
    return this.currentStep === 1 ? 50 : 100;
  }
}