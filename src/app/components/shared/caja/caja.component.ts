import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

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
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss']
})
export class CajaComponent implements OnInit, OnDestroy {
  @Input() cajaData: CajaData = {
    id: 'SF-001',
    name: 'Caja Fuerte Principal',
    location: 'Sucursal Centro - Planta Baja',
    status: 'normal',
    isLocked: true,
    lastAccess: new Date().toISOString(),
    batteryLevel: 85,
    sensors: {
      nfc: {
        status: 'normal',
        lastRead: new Date().toISOString(),
        cardId: 'CARD_12345',
        signalStrength: 95
      },
      display: {
        status: 'normal',
        brightness: 80,
        currentMessage: 'SISTEMA ACTIVO',
        uptime: '72h 15m'
      },
      temperature: {
        status: 'normal',
        current: 23.2,
        min: 18.0,
        max: 30.0,
        history: [22.8, 23.1, 23.2, 23.0, 22.9]
      },
      humidity: {
        status: 'warning',
        current: 58,
        min: 30,
        max: 60,
        history: [45, 52, 58, 55, 57]
      },
      lock: {
        status: 'normal',
        isLocked: true,
        attempts: 0,
        lastUnlock: new Date().toISOString(),
        mechanism: 'Electrónico + Mecánico'
      },
      weight: {
        status: 'normal',
        current: 45.7,
        baseline: 45.5,
        threshold: 2.0,
        unit: 'kg'
      },
      camera: {
        status: 'normal',
        isRecording: false,
        resolution: '1080p',
        fps: 30,
        nightVision: true,
        motionDetection: true,
        lastSnapshot: new Date().toISOString(),
        storageUsed: 65,
        storageTotal: 100
      }
    }
  };

  expandedSensor: string | null = null;
  showAllSensors = false;
  private updateSubscription?: Subscription;
  Math = Math; // Hacer Math accesible en el template
  selectedSensor: string | null = null;
  showSensorsModal: boolean = false;

  ngOnInit() {
    // Simulación de actualizaciones en tiempo real
    this.updateSubscription = interval(3000).subscribe(() => {
      this.updateSensorData();
    });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  private updateSensorData() {
    // Actualizar temperatura
    const tempChange = (Math.random() - 0.5) * 0.3;
    this.cajaData.sensors.temperature.current = 
      Math.round((this.cajaData.sensors.temperature.current + tempChange) * 10) / 10;
    
    this.cajaData.sensors.temperature.history = [
      ...this.cajaData.sensors.temperature.history.slice(1),
      this.cajaData.sensors.temperature.current
    ];

    // Actualizar humedad
    const humidityChange = Math.round((Math.random() - 0.5) * 2);
    this.cajaData.sensors.humidity.current = 
      Math.max(0, Math.min(100, this.cajaData.sensors.humidity.current + humidityChange));
    
    this.cajaData.sensors.humidity.history = [
      ...this.cajaData.sensors.humidity.history.slice(1),
      this.cajaData.sensors.humidity.current
    ];

    // Actualizar peso
    const weightChange = (Math.random() - 0.5) * 0.1;
    this.cajaData.sensors.weight.current = 
      Math.round((this.cajaData.sensors.weight.current + weightChange) * 10) / 10;
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getHistoryBarHeight(value: number, history: number[]): number {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min;
    
    if (range === 0) return 12; // altura por defecto si todos los valores son iguales
    
    const normalized = (value - min) / range;
    return Math.max(4, Math.round(normalized * 16 + 4)); // altura entre 4px y 20px
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
      case 'critical': return 'fas fa-shield-alt';
      default: return 'fas fa-exclamation-triangle';
    }
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
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
    this.showSensorsModal = false; // Cerrar modal de sensores
  }

  closeSensorModal() {
    this.selectedSensor = null;
    this.showSensorsModal = true; // Volver al modal de sensores
  }

  getSensorCount(): number {
    const sensors = Object.keys(this.cajaData.sensors);
    return sensors.filter(sensor => this.getSensorStatus(sensor) === 'normal').length;
  }

  getSensorDisplayValue(sensor: string): string {
    switch (sensor) {
      case 'temperature':
        return `${this.cajaData.sensors.temperature.current}°C`;
      case 'humidity':
        return `${this.cajaData.sensors.humidity.current}%`;
      case 'weight':
        return `${this.cajaData.sensors.weight.current} ${this.cajaData.sensors.weight.unit}`;
      case 'nfc':
        return `${this.cajaData.sensors.nfc.signalStrength}%`;
      case 'display':
        return `${this.cajaData.sensors.display.brightness}%`;
      case 'camera':
        return this.cajaData.sensors.camera.isRecording ? 'GRABANDO' : 'ACTIVA';
      case 'lock':
        return this.cajaData.sensors.lock.isLocked ? 'CERRADA' : 'ABIERTA';
      default:
        return '';
    }
  }
}
