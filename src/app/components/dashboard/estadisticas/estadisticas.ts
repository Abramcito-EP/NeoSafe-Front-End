import { Component } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar';

@Component({
  selector: 'app-estadisticas',
  imports: [SidebarComponent],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.scss'
})
export class EstadisticasComponent {
  // Aquí puedes agregar la lógica necesaria para las estadísticas
  // Por ejemplo, cargar datos desde un servicio o definir variables de estado

}
