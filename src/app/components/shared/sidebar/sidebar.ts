import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { User } from '../../../models/user.model';
import { Observable, Subscription } from 'rxjs';

// Material imports
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  isDarkMode = false;
  private themeSubscription?: Subscription;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

 
  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

 
  
  applyTheme(): void {
    // Aplica la clase al documento para efectos globales
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
  
  logout(): void {
    // Primero limpiamos localmente la sesión
    this.authService.clearSession();
    
    // Luego hacemos la llamada al servidor
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }
}
