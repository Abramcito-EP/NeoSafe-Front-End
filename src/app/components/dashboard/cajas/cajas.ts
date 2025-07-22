import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { CajaComponent } from '../../shared/caja/caja.component';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, CajaComponent],
  templateUrl: './cajas.html',
  styleUrls: ['./cajas.scss']
})
export class CajasComponent {

}
