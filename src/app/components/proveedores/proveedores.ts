import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class ProveedoresComponent {

}
