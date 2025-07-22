import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  showNavbar = true;
  
  constructor(private router: Router) {
    // Escuchar cambios en la navegación para ocultar/mostrar la navbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Ocultar navbar en rutas específicas
      this.showNavbar = !this.isNavbarHiddenRoute(event.url);
    });
  }
  
  private isNavbarHiddenRoute(url: string): boolean {
    // Añadir todas las rutas donde la navbar debe ocultarse
    const hiddenRoutes = [
      '/dashboard',
      '/safes',
      '/stats',
      '/profile',
      '/settings'
    ];
    
    return hiddenRoutes.some(route => url.startsWith(route));
  }
}

export { AppComponent as default };
