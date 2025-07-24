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
  sensors: {
    nfc: any;
    display: any;
    temperature: any;
    humidity: any;
    lock: any;
    weight: any;
    camera: any;
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
    // En un entorno real, esto haría una llamada a la API
    this.cajaData.sensors.camera.isRecording = !this.cajaData.sensors.camera.isRecording;
  }

  getSensorIcon(sensor: string): string {
    switch (sensor) {
      case 'nfc': return 'fas fa-wifi';
      case 'display': return 'fas fa-desktop';
      case 'temperature': return 'fas fa-thermometer-half';
      case 'humidity': return 'fas fa-tint';
      case 'lock': return 'fas fa-lock';
      case 'weight': return 'fas fa-weight';
      case 'camera': return 'fas fa-camera';
      default: return 'fas fa-cog';
    }
  }

  getSensorTitle(sensor: string): string {
    switch (sensor) {
      case 'nfc': return 'Sensor NFC';
      case 'display': return 'Pantalla Digital';
      case 'temperature': return 'Sensor de Temperatura';
      case 'humidity': return 'Sensor de Humedad';
      case 'lock': return 'Sistema de Cerradura';
      case 'weight': return 'Sensor de Peso';
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
    return sensors.filter(sensor => 
      this.getSensorStatus(sensor) === 'normal' || this.getSensorStatus(sensor) === 'warning'
    ).length;
  }

  getSensorDisplayValue(sensor: string): string {
    const sensorData = this.getSensorData(sensor);
    if (!sensorData) return '';

    switch (sensor) {
      case 'temperature':
        return sensorData.current ? `${sensorData.current.toFixed(1)}°C` : 'N/A';
      case 'humidity':
        return sensorData.current ? `${Math.round(sensorData.current)}%` : 'N/A';
      case 'weight':
        return sensorData.current ? `${sensorData.current.toFixed(1)} ${sensorData.unit}` : 'N/A';
      case 'nfc':
        return `${sensorData.signalStrength}%`;
      case 'display':
        return `${sensorData.brightness}%`;
      case 'camera':
        return sensorData.isRecording ? 'GRABANDO' : 'ACTIVA';
      case 'lock':
        return sensorData.isLocked ? 'CERRADA' : 'ABIERTA';
      default:
        return '';
    }
  }

  // Verificar si hay datos de sensores disponibles
  hasSensorData(sensor: string): boolean {
    const data = this.getSensorData(sensor);
    return data && (data.current !== undefined && data.current !== null);
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
}
