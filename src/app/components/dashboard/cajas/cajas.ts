import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
@Component({
  selector: 'app-cajas',
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './cajas.html',
  styleUrl: './cajas.scss'
})
export class CajasComponent {

}
