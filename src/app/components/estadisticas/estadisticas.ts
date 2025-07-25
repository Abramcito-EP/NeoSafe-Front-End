import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../shared/sidebar/sidebar';

interface RecentActivity {
  fecha: Date;
  cajaName: string;
  accion: string;
  estado: 'exitoso' | 'fallido';
  usuario?: string;
  ip?: string;
}

interface TopCaja {
  name: string;
  accesos: number;
  percentage: number;
}

interface Alerta {
  id: string;
  tipo: 'warning' | 'error' | 'info';
  titulo: string;
  descripcion: string;
  fecha: Date;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.scss']
})
export class EstadisticasComponent implements OnInit {
  // KPI Data
  totalCajas = 12;
  cajasActivas = 10;
  cajasInactivas = 1;
  cajasMantenimiento = 1;
  accesosTotal = 1247;

  // Recent Activity Data
  recentActivity: RecentActivity[] = [
    {
      fecha: new Date(2024, 0, 15, 14, 30),
      cajaName: 'Caja Segura A',
      accion: 'Acceso autorizado',
      estado: 'exitoso'
    },
    {
      fecha: new Date(2024, 0, 15, 13, 45),
      cajaName: 'Caja Personal B',
      accion: 'Intento de acceso',
      estado: 'fallido'
    },
    {
      fecha: new Date(2024, 0, 15, 12, 20),
      cajaName: 'Caja Documentos',
      accion: 'Acceso autorizado',
      estado: 'exitoso'
    },
    {
      fecha: new Date(2024, 0, 15, 11, 15),
      cajaName: 'Caja Valuables',
      accion: 'Acceso autorizado',
      estado: 'exitoso'
    },
    {
      fecha: new Date(2024, 0, 15, 10, 30),
      cajaName: 'Caja Backup',
      accion: 'Mantenimiento',
      estado: 'exitoso'
    }
  ];

  // Top Cajas Data
  topCajas: TopCaja[] = [
    { name: 'Caja Segura A', accesos: 156, percentage: 100 },
    { name: 'Caja Personal B', accesos: 134, percentage: 86 },
    { name: 'Caja Documentos', accesos: 98, percentage: 63 },
    { name: 'Caja Valuables', accesos: 87, percentage: 56 },
    { name: 'Caja Backup', accesos: 45, percentage: 29 }
  ];

  // Alertas Data
  alertas: Alerta[] = [
    {
      id: '1',
      tipo: 'warning',
      titulo: 'Batería baja detectada',
      descripcion: 'La Caja Segura A tiene batería al 15%',
      fecha: new Date(2024, 0, 15, 14, 30)
    },
    {
      id: '2',
      tipo: 'error',
      titulo: 'Intento de acceso no autorizado',
      descripcion: 'Se detectaron 3 intentos fallidos en Caja Personal B',
      fecha: new Date(2024, 0, 15, 13, 45)
    },
    {
      id: '3',
      tipo: 'info',
      titulo: 'Mantenimiento programado',
      descripcion: 'Mantenimiento completado en Caja Backup',
      fecha: new Date(2024, 0, 15, 10, 30)
    }
  ];

  // Modal states
  showActivityModal = false;
  showTopCajasModal = false;

  // Activity modal data
  filteredActivity: RecentActivity[] = [];
  allActivity: RecentActivity[] = [];
  activityFilter = {
    caja: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  totalRecords = 0;

  // Additional data for modals
  availableCajas = [
    { id: 'caja-001', name: 'Caja Segura A' },
    { id: 'caja-002', name: 'Caja Personal B' },
    { id: 'caja-003', name: 'Caja Documentos' },
    { id: 'caja-004', name: 'Caja Valuables' },
    { id: 'caja-005', name: 'Caja Backup' }
  ];

  allCajasRanking = [
    { 
      id: 'caja-001',
      name: 'Caja Segura A', 
      accesos: 156, 
      percentage: 100,
      ultimoAcceso: new Date(2024, 0, 15, 14, 30),
      promedioSemanal: 36
    },
    { 
      id: 'caja-002',
      name: 'Caja Personal B', 
      accesos: 134, 
      percentage: 86,
      ultimoAcceso: new Date(2024, 0, 15, 13, 45),
      promedioSemanal: 31
    },
    { 
      id: 'caja-003',
      name: 'Caja Documentos', 
      accesos: 98, 
      percentage: 63,
      ultimoAcceso: new Date(2024, 0, 15, 12, 20),
      promedioSemanal: 23
    },
    { 
      id: 'caja-004',
      name: 'Caja Valuables', 
      accesos: 87, 
      percentage: 56,
      ultimoAcceso: new Date(2024, 0, 15, 11, 15),
      promedioSemanal: 20
    },
    { 
      id: 'caja-005',
      name: 'Caja Backup', 
      accesos: 45, 
      percentage: 29,
      ultimoAcceso: new Date(2024, 0, 14, 16, 30),
      promedioSemanal: 11
    }
  ];

  averageDailyAccess = 17;
  mostActiveDay = 'Lunes';
  mostActiveDayCount = 45;

  constructor() { }

  ngOnInit(): void {
    this.loadStatistics();
    this.generateFullActivity();
  }

  generateFullActivity(): void {
    // Generar datos de actividad más completos para el modal
    this.allActivity = [
      {
        fecha: new Date(2024, 0, 15, 14, 30),
        cajaName: 'Caja Segura A',
        usuario: 'Admin Usuario',
        accion: 'Acceso autorizado',
        estado: 'exitoso',
        ip: '192.168.1.100'
      },
      {
        fecha: new Date(2024, 0, 15, 13, 45),
        cajaName: 'Caja Personal B',
        usuario: 'Admin Usuario',
        accion: 'Intento de acceso',
        estado: 'fallido',
        ip: '192.168.1.100'
      },
      {
        fecha: new Date(2024, 0, 15, 12, 20),
        cajaName: 'Caja Documentos',
        usuario: 'Admin Usuario',
        accion: 'Acceso autorizado',
        estado: 'exitoso',
        ip: '192.168.1.100'
      },
      {
        fecha: new Date(2024, 0, 15, 11, 15),
        cajaName: 'Caja Valuables',
        usuario: 'Admin Usuario',
        accion: 'Acceso autorizado',
        estado: 'exitoso',
        ip: '192.168.1.100'
      },
      {
        fecha: new Date(2024, 0, 15, 10, 30),
        cajaName: 'Caja Backup',
        usuario: 'Admin Usuario',
        accion: 'Mantenimiento',
        estado: 'exitoso',
        ip: '192.168.1.100'
      },
      {
        fecha: new Date(2024, 0, 15, 9, 15),
        cajaName: 'Caja Segura A',
        usuario: 'Juan Pérez',
        accion: 'Acceso autorizado',
        estado: 'exitoso',
        ip: '192.168.1.101'
      },
      {
        fecha: new Date(2024, 0, 15, 8, 30),
        cajaName: 'Caja Documentos',
        usuario: 'María García',
        accion: 'Configuración actualizada',
        estado: 'exitoso',
        ip: '192.168.1.102'
      },
      {
        fecha: new Date(2024, 0, 14, 17, 45),
        cajaName: 'Caja Personal B',
        usuario: 'Carlos López',
        accion: 'Intento de acceso',
        estado: 'fallido',
        ip: '192.168.1.103'
      }
    ];
    
    this.filteredActivity = [...this.allActivity];
    this.updatePagination();
  }

  loadStatistics(): void {
    // Aquí cargarías los datos desde un servicio
    console.log('Cargando estadísticas...');
  }

  // Modal methods
  openActivityModal(): void {
    this.showActivityModal = true;
    this.resetActivityFilter();
  }

  closeActivityModal(): void {
    this.showActivityModal = false;
  }

  openTopCajasModal(): void {
    this.showTopCajasModal = true;
  }

  closeTopCajasModal(): void {
    this.showTopCajasModal = false;
  }

  // Filter methods
  resetActivityFilter(): void {
    this.activityFilter = {
      caja: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: ''
    };
    this.filterActivity();
  }

  filterActivity(): void {
    this.filteredActivity = this.allActivity.filter(activity => {
      let matches = true;

      if (this.activityFilter.caja) {
        const caja = this.availableCajas.find(c => c.id === this.activityFilter.caja);
        matches = matches && activity.cajaName === caja?.name;
      }

      if (this.activityFilter.estado) {
        matches = matches && activity.estado === this.activityFilter.estado;
      }

      if (this.activityFilter.fechaDesde) {
        const fechaDesde = new Date(this.activityFilter.fechaDesde);
        matches = matches && activity.fecha >= fechaDesde;
      }

      if (this.activityFilter.fechaHasta) {
        const fechaHasta = new Date(this.activityFilter.fechaHasta);
        fechaHasta.setHours(23, 59, 59);
        matches = matches && activity.fecha <= fechaHasta;
      }

      return matches;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  // Pagination methods
  updatePagination(): void {
    this.totalRecords = this.filteredActivity.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPaginatedActivity(): RecentActivity[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredActivity.slice(startIndex, endIndex);
  }

  getMedalClass(index: number): string {
    switch (index) {
      case 0: return 'gold';
      case 1: return 'silver';
      case 2: return 'bronze';
      default: return '';
    }
  }

  getAlertIcon(tipo: string): string {
    switch (tipo) {
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-bell';
    }
  }

  dismissAlert(alertId: string): void {
    this.alertas = this.alertas.filter(alerta => alerta.id !== alertId);
  }
}
