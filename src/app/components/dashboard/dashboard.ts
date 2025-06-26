import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';

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
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Suscribirse al usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
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
}