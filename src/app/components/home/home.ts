import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
