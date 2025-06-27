import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SensorsService, SensorData } from '../../services/sensors.service';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Importar módulos de Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  
  // Datos de sensores
  temperatureData: SensorData | null = null;
  humidityData: SensorData | null = null;
  weightData: SensorData | null = null;
  isConnected: boolean = false;
  
  // Suscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private sensorsService: SensorsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Suscribirse al usuario actual
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Conectar a los sensores
    this.connectToSensors();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Desconectar sensores
    this.sensorsService.disconnect();
  }

  private connectToSensors() {
    // Conectar al servicio de sensores
    this.sensorsService.connect();

    // Suscribirse al estado de conexión
    this.subscriptions.push(
      this.sensorsService.connected$.subscribe(connected => {
        this.isConnected = connected;
        if (connected) {
          this.snackBar.open('Sensores conectados', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      })
    );

    // Suscribirse a los datos de temperatura
    this.subscriptions.push(
      this.sensorsService.temperature$.subscribe(data => {
        this.temperatureData = data;
      })
    );

    // Suscribirse a los datos de humedad
    this.subscriptions.push(
      this.sensorsService.humidity$.subscribe(data => {
        this.humidityData = data;
      })
    );

    // Suscribirse a los datos de peso
    this.subscriptions.push(
      this.sensorsService.weight$.subscribe(data => {
        this.weightData = data;
      })
    );
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.snackBar.open('Sesión cerrada correctamente', 'Cerrar', {
          duration: 3000
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        // Incluso si hay error en el backend, cerramos sesión localmente
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  getWelcomeMessage(): string {
    if (this.currentUser) {
      return `¡Bienvenido, ${this.currentUser.name} ${this.currentUser.lastName}!`;
    }
    return '¡Bienvenido!';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No especificada';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTimestamp(timestamp?: string | Date): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}