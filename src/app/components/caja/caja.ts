import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

export interface CajaData {
  id: string;
  name: string;
  location: string;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  isLocked: boolean;
  lastAccess: string;
  batteryLevel: number;
  // Información de reclamo
  isClaimed: boolean;
  claimCode?: string; // Solo si no está reclamada
  owner?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  provider?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  sensors: {
    temperature: {
      status: string;
      current: number;
      min: number;
      max: number;
      history: number[];
    };
    humidity: {
      status: string;
      current: number;
      min: number;
      max: number;
      history: number[];
    };
    lock?: {  // Hacer lock opcional también
      status: string;
      isLocked: boolean;
      attempts: number;
      lastUnlock: string;
      mechanism: string;
    };
    camera: {  // Cámara obligatoria (simulada para todas las cajas)
      status: string;
      isRecording: boolean;
      resolution: string;
      fps: number;
      storageUsed: number;
      storageTotal: number;
    };
  };
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caja.html',
  styleUrls: ['./caja.scss']
})
export class CajaComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cajaData!: CajaData;

  expandedSensor: string | null = null;
  showAllSensors = false;
  selectedSensor: string | null = null;
  showSensorsModal: boolean = false;
  cameraError: boolean = false;
  
  // Datos locales para el timestamp
  currentTime: string = '';
  private timeUpdateSubscription?: any;
  
  Math = Math; // Hacer Math accesible en el template

  ngOnInit() {
    // Actualizar tiempo cada segundo
    this.updateCurrentTime();
    this.timeUpdateSubscription = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeUpdateSubscription) {
      clearInterval(this.timeUpdateSubscription);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reaccionar a cambios en cajaData si es necesario
    if (changes['cajaData'] && changes['cajaData'].currentValue) {
      // Los datos ya vienen actualizados del dashboard
      // No necesitamos hacer nada especial aquí
    }
  }

  private updateCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getCurrentTime(): string {
    return this.currentTime;
  }

  getHistoryBarHeight(value: number, history: number[]): number {
    if (!history || history.length === 0) return 12;
    
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min;
    
    if (range === 0) return 12;
    
    const normalized = (value - min) / range;
    return Math.max(4, Math.round(normalized * 16 + 4));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'normal': return 'status-normal';
      case 'warning': return 'status-warning';
      case 'critical': return 'status-critical';
      case 'offline': return 'status-offline';
      default: return 'status-offline';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'normal': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'critical': return 'fas fa-times-circle';
      case 'offline': return 'fas fa-wifi-slash';
      default: return 'fas fa-question-circle';
    }
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
  }

  toggleSensorExpansion(sensor: string) {
    this.expandedSensor = this.expandedSensor === sensor ? null : sensor;
  }

  toggleAllSensors() {
    this.showAllSensors = !this.showAllSensors;
  }

  toggleRecording() {
    // Solo funciona en caja SF-001 si la cámara está activa
    if (this.cajaData.id === 'SF-001' && this.cajaData.sensors.camera.status === 'normal') {
      this.cajaData.sensors.camera.isRecording = !this.cajaData.sensors.camera.isRecording;
    } else {
      console.warn('Cámara no disponible en esta caja');
    }
  }

  getSensorIcon(sensor: string): string {
    switch (sensor) {
      case 'temperature': return 'fas fa-thermometer-half';
      case 'humidity': return 'fas fa-tint';
      case 'lock': return 'fas fa-lock';
      case 'camera': return 'fas fa-camera';
      default: return 'fas fa-cog';
    }
  }

  getSensorTitle(sensor: string): string {
    switch (sensor) {
      case 'temperature': return 'Sensor de Temperatura';
      case 'humidity': return 'Sensor de Humedad';
      case 'lock': return 'Sistema de Cerradura';
      case 'camera': return 'Sistema de Cámara';
      default: return 'Sensor';
    }
  }

  getSensorData(sensor: string): any {
    return (this.cajaData.sensors as any)[sensor];
  }

  getSensorStatus(sensor: string): string {
    return this.getSensorData(sensor)?.status || 'offline';
  }

  openSensorsModal() {
    this.showSensorsModal = true;
  }

  closeSensorsModal() {
    this.showSensorsModal = false;
  }

  openSensorModal(sensor: string) {
    this.selectedSensor = sensor;
    this.showSensorsModal = false;
  }

  closeSensorModal() {
    this.selectedSensor = null;
    this.showSensorsModal = true;
  }

  getSensorCount(): number {
    const sensors = Object.keys(this.cajaData.sensors);
    return sensors.filter(sensor => {
      const sensorData = this.getSensorData(sensor);
      return sensorData && (this.getSensorStatus(sensor) === 'normal' || this.getSensorStatus(sensor) === 'warning');
    }).length;
  }

  getSensorDisplayValue(sensor: string): string {
    const sensorData = this.getSensorData(sensor);
    if (!sensorData) return '';

    switch (sensor) {
      case 'temperature':
        return sensorData.current ? `${sensorData.current.toFixed(1)}°C` : 'N/A';
      case 'humidity':
        return sensorData.current ? `${Math.round(sensorData.current)}%` : 'N/A';
      case 'camera':
        if (sensorData.status === 'offline') return 'NO DISPONIBLE';
        return sensorData.isRecording ? 'GRABANDO' : 'ACTIVA';
      case 'lock':
        return sensorData && sensorData.isLocked !== undefined ? (sensorData.isLocked ? 'CERRADA' : 'ABIERTA') : 'N/A';
      default:
        return '';
    }
  }

  // Obtener lista de sensores disponibles (sin lock, siempre con cámara)
  getSensorsList(): string[] {
    return ['temperature', 'humidity', 'camera'];
  }

  // Verificar si hay datos de sensores disponibles
  hasSensorData(sensor: string): boolean {
    const data = this.getSensorData(sensor);
    return data && (data.current !== undefined && data.current !== null);
  }

  // Verificar si la caja tiene sensores disponibles para mostrar
  hasSensors(): boolean {
    return this.cajaData.sensors && Object.keys(this.cajaData.sensors).length > 0;
  }

  // Copiar código de reclamo al portapapeles
  copyClaimCode() {
    if (this.cajaData.claimCode) {
      navigator.clipboard.writeText(this.cajaData.claimCode).then(() => {
        console.log('Código copiado al portapapeles');
        // Aquí podrías mostrar una notificación de éxito
      }).catch(err => {
        console.error('Error al copiar código:', err);
      });
    }
  }

  // Obtener el estado de salud general de la caja
  getHealthStatus(): { status: string, message: string } {
    const criticalCount = Object.keys(this.cajaData.sensors)
      .filter(sensor => this.getSensorStatus(sensor) === 'critical').length;
    
    const warningCount = Object.keys(this.cajaData.sensors)
      .filter(sensor => this.getSensorStatus(sensor) === 'warning').length;

    if (criticalCount > 0) {
      return { status: 'critical', message: `${criticalCount} sensor(es) crítico(s)` };
    }
    if (warningCount > 0) {
      return { status: 'warning', message: `${warningCount} sensor(es) con alerta` };
    }
    return { status: 'normal', message: 'Todos los sensores funcionan correctamente' };
  }

  // Manejar error de carga de la cámara
  onCameraError(event: any) {
    console.error('Error al cargar el stream de la cámara:', event);
    this.cameraError = true;
    // Intentar recargar después de 5 segundos
    setTimeout(() => {
      this.cameraError = false;
    }, 5000);
  }

  // Manejar carga exitosa de la cámara
  onCameraLoad(event: any) {
    console.log('Stream de cámara cargado exitosamente');
    this.cameraError = false;
  }
}
