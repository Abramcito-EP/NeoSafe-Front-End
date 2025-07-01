import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-home',
  standalone: true,
  
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  title = 'NeoSafe';
  
  ngOnInit() {
    // Inicializar variables o servicios si es necesario
  }
  
  ngAfterViewInit() {
    this.initScrollAnimations();
  }
  
  private initScrollAnimations() {
    if (typeof window !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0');
          }
        });
      }, { threshold: 0.1 });
      
      const elements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeIn');
      elements.forEach(el => {
        observer.observe(el);
      });
    }
  }
}
