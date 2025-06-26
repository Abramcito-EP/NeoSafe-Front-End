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
    // Primer paso: Información personal
    this.step1Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['']
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
    if (this.step2Form.invalid) {
      return;
    }

    // Combinar ambos formularios
    const registerData = {
      ...this.step1Form.value,
      ...this.step2Form.value
    };

    this.loading = true;
    this.authService.register(registerData).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión', 'Cerrar', {
          duration: 4000
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error.message || 'Error al crear la cuenta', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  getProgressPercentage(): number {
    return this.currentStep === 1 ? 50 : 100;
  }
}