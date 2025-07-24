import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { CajaComponent, CajaData } from '../caja/caja';
import { SensorsService, SensorsDataUpdate } from '../../services/sensors.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, CajaComponent],
  templateUrl: './cajas.html',
  styleUrls: ['./cajas.scss']
})
export class CajasComponent implements OnInit, OnDestroy {
addCaja() {
throw new Error('Method not implemented.');
}
getActiveSensors() {
throw new Error('Method not implemented.');
}
  cajasData: CajaData[] = [];
  isLoading: boolean = true;
  isConnected: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private sensorsService: SensorsService) {}

  ngOnInit() {
    this.initializeCajasData();
    this.connectToSensors();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.sensorsService.disconnect();
  }

  private initializeCajasData() {
    // Inicializar con datos base de las cajas
    this.cajasData = [
      {
        id: 'SF-001',
        name: 'Caja Fuerte Principal',
        location: 'Sucursal Centro - Planta Baja',
        status: 'normal',
        isLocked: true,
        lastAccess: new Date().toISOString(),
        batteryLevel: 85,
        sensors: {
          nfc: { status: 'normal', lastRead: new Date().toISOString(), cardId: 'CARD_12345', signalStrength: 95 },
          display: { status: 'normal', brightness: 80, currentMessage: 'SISTEMA ACTIVO', uptime: '72h 15m' },
          temperature: { status: 'normal', current: 0, min: 18.0, max: 30.0, history: [] },
          humidity: { status: 'normal', current: 0, min: 30, max: 60, history: [] },
          lock: { status: 'normal', isLocked: true, attempts: 0, lastUnlock: new Date().toISOString(), mechanism: 'Electrónico + Mecánico' },
          weight: { status: 'normal', current: 0, baseline: 45.5, threshold: 2.0, unit: 'kg' },
          camera: { status: 'normal', isRecording: false, resolution: '1080p', fps: 30, nightVision: true, motionDetection: true, lastSnapshot: new Date().toISOString(), storageUsed: 65, storageTotal: 100 }
        }
      },
      {
        id: 'SF-002',
        name: 'Caja Fuerte Secundaria',
        location: 'Sucursal Norte - Segundo Piso',
        status: 'warning',
        isLocked: true,
        lastAccess: new Date(Date.now() - 3600000).toISOString(),
        batteryLevel: 42,
        sensors: {
          nfc: { status: 'warning', lastRead: new Date().toISOString(), cardId: 'CARD_67890', signalStrength: 78 },
          display: { status: 'normal', brightness: 60, currentMessage: 'BATERÍA BAJA', uptime: '168h 32m' },
          temperature: { status: 'normal', current: 0, min: 18.0, max: 30.0, history: [] },
          humidity: { status: 'warning', current: 0, min: 30, max: 60, history: [] },
          lock: { status: 'normal', isLocked: true, attempts: 1, lastUnlock: new Date(Date.now() - 7200000).toISOString(), mechanism: 'Electrónico + Mecánico' },
          weight: { status: 'normal', current: 0, baseline: 32.1, threshold: 1.5, unit: 'kg' },
          camera: { status: 'normal', isRecording: true, resolution: '720p', fps: 24, nightVision: true, motionDetection: true, lastSnapshot: new Date().toISOString(), storageUsed: 89, storageTotal: 50 }
        }
      },
      {
        id: 'SF-003',
        name: 'Caja Fuerte Móvil',
        location: 'Vehículo de Transporte #4',
        status: 'critical',
        isLocked: false,
        lastAccess: new Date(Date.now() - 1800000).toISOString(),
        batteryLevel: 15,
        sensors: {
          nfc: { status: 'offline', lastRead: new Date(Date.now() - 3600000).toISOString(), cardId: 'CARD_UNKNOWN', signalStrength: 0 },
          display: { status: 'critical', brightness: 10, currentMessage: 'BATERÍA CRÍTICA', uptime: '96h 42m' },
          temperature: { status: 'warning', current: 0, min: 15.0, max: 35.0, history: [] },
          humidity: { status: 'critical', current: 0, min: 20, max: 70, history: [] },
          lock: { status: 'critical', isLocked: false, attempts: 3, lastUnlock: new Date(Date.now() - 1800000).toISOString(), mechanism: 'Solo Electrónico' },
          weight: { status: 'warning', current: 0, baseline: 12.3, threshold: 1.0, unit: 'kg' },
          camera: { status: 'offline', isRecording: false, resolution: '480p', fps: 15, nightVision: false, motionDetection: false, lastSnapshot: new Date(Date.now() - 7200000).toISOString(), storageUsed: 95, storageTotal: 32 }
        }
      }
    ];

    this.loadInitialSensorData();
  }

  private async loadInitialSensorData() {
    try {
      this.isLoading = true;
      
      // Cargar datos más recientes
      const latestData = await this.sensorsService.getLatestData().toPromise();
      if (latestData) {
        this.updateCajasWithSensorData(latestData);
      }

      // Cargar datos históricos
      await this.loadHistoricalData();
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadHistoricalData() {
    try {
      const [tempHistory, humidityHistory] = await Promise.all([
        this.sensorsService.getHistoricalData('temperature', 6).toPromise(),
        this.sensorsService.getHistoricalData('humidity', 6).toPromise()
      ]);

      this.cajasData.forEach(caja => {
        if (tempHistory && tempHistory.length > 0) {
          caja.sensors.temperature.history = tempHistory.map(item => item.value).slice(-5);
        }
        if (humidityHistory && humidityHistory.length > 0) {
          caja.sensors.humidity.history = humidityHistory.map(item => item.value).slice(-5);
        }
      });

    } catch (error) {
      console.error('Error cargando datos históricos:', error);
    }
  }

  private connectToSensors() {
    this.sensorsService.connect();

    this.subscriptions.push(
      this.sensorsService.connected$.subscribe(connected => {
        this.isConnected = connected;
      })
    );

    this.subscriptions.push(
      this.sensorsService.temperature$.subscribe(data => {
        if (data) this.updateTemperatureInCajas(data);
      })
    );

    this.subscriptions.push(
      this.sensorsService.humidity$.subscribe(data => {
        if (data) this.updateHumidityInCajas(data);
      })
    );

    this.subscriptions.push(
      this.sensorsService.weight$.subscribe(data => {
        if (data) this.updateWeightInCajas(data);
      })
    );
  }

  private updateCajasWithSensorData(sensorsData: SensorsDataUpdate) {
    this.cajasData.forEach(caja => {
      if (sensorsData.temperature) {
        caja.sensors.temperature.current = sensorsData.temperature.value;
        caja.sensors.temperature.status = this.getSensorStatus(
          sensorsData.temperature.value, 
          caja.sensors.temperature.min, 
          caja.sensors.temperature.max
        );
      }

      if (sensorsData.humidity) {
        caja.sensors.humidity.current = sensorsData.humidity.value;
        caja.sensors.humidity.status = this.getSensorStatus(
          sensorsData.humidity.value, 
          caja.sensors.humidity.min, 
          caja.sensors.humidity.max
        );
      }

      if (sensorsData.weight) {
        caja.sensors.weight.current = sensorsData.weight.value;
        const weightDiff = Math.abs(sensorsData.weight.value - caja.sensors.weight.baseline);
        caja.sensors.weight.status = weightDiff > caja.sensors.weight.threshold ? 'warning' : 'normal';
      }

      caja.status = this.calculateOverallStatus(caja);
    });
  }

  private updateTemperatureInCajas(data: any) {
    this.cajasData.forEach(caja => {
      caja.sensors.temperature.current = data.value;
      caja.sensors.temperature.history = [
        ...caja.sensors.temperature.history.slice(-4),
        data.value
      ];
      caja.sensors.temperature.status = this.getSensorStatus(
        data.value,
        caja.sensors.temperature.min,
        caja.sensors.temperature.max
      );
      caja.status = this.calculateOverallStatus(caja);
    });
  }

  private updateHumidityInCajas(data: any) {
    this.cajasData.forEach(caja => {
      caja.sensors.humidity.current = data.value;
      caja.sensors.humidity.history = [
        ...caja.sensors.humidity.history.slice(-4),
        data.value
      ];
      caja.sensors.humidity.status = this.getSensorStatus(
        data.value,
        caja.sensors.humidity.min,
        caja.sensors.humidity.max
      );
      caja.status = this.calculateOverallStatus(caja);
    });
  }

  private updateWeightInCajas(data: any) {
    this.cajasData.forEach(caja => {
      caja.sensors.weight.current = data.value;
      const weightDiff = Math.abs(data.value - caja.sensors.weight.baseline);
      caja.sensors.weight.status = weightDiff > caja.sensors.weight.threshold ? 'warning' : 'normal';
      caja.status = this.calculateOverallStatus(caja);
    });
  }

  private getSensorStatus(value: number, min: number, max: number): 'normal' | 'warning' | 'critical' {
    if (value < min || value > max) {
      const deviation = Math.min(Math.abs(value - min), Math.abs(value - max));
      const range = max - min;
      const deviationPercentage = (deviation / range) * 100;
      return deviationPercentage > 20 ? 'critical' : 'warning';
    }
    return 'normal';
  }

  private calculateOverallStatus(caja: CajaData): 'normal' | 'warning' | 'critical' | 'offline' {
    const sensorStatuses = Object.values(caja.sensors).map(sensor => sensor.status);
    
    if (sensorStatuses.includes('critical')) return 'critical';
    if (sensorStatuses.includes('warning')) return 'warning';
    if (sensorStatuses.includes('offline')) return 'offline';
    
    return 'normal';
  }

  trackByCajaId(index: number, caja: CajaData): string {
    return caja.id;
  }

  refreshAllData() {
    this.loadInitialSensorData();
  }
}
