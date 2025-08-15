import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, Subscription } from 'rxjs';
import { switchMap, retry, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';
import { io, Socket } from 'socket.io-client';

export interface SensorData {
  current: any;
  value: number;
  timestamp: string;
}

export interface SensorsDataUpdate {
  temperature: SensorData | null;
  humidity: SensorData | null;
}

export interface PollingResponse {
  boxId: number;
  timestamp: string;
  sensors: {
    temperature: {
      value: number;
      unit: string;
      timestamp: string;
      sensor: string;
    } | null;
    humidity: {
      value: number;
      unit: string;
      timestamp: string;
      sensor: string;
    } | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SensorsService {
  private socket: Socket | null = null;
  private apiUrl = `${environment.apiUrl}/sensors`;
  
  // Subjects para datos de sensores
  private temperatureSubject = new BehaviorSubject<SensorData | null>(null);
  private humiditySubject = new BehaviorSubject<SensorData | null>(null);
  
  // Observables públicos
  public temperature$ = this.temperatureSubject.asObservable();
  public humidity$ = this.humiditySubject.asObservable();
  
  // Estado de conexión WebSocket
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  // Sistema de polling
  private pollingSubscriptions: Map<number, Subscription> = new Map();
  private pollingInterval = 3000; // 3 segundos por defecto

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  connect() {
    if (this.socket?.connected) {
      return;
    }

    // Como no estamos usando autenticación en Socket.io por ahora, conectamos directamente
    this.socket = io(environment.wsUrl);
    
    this.socket.on('connect', () => {
      console.log('Socket.io conectado');
      this.connectedSubject.next(true);
      
      // Unirse al canal de sensores
      this.socket?.emit('join:sensors');
    });
    
    // Datos iniciales
    this.socket.on('sensors:initialData', (data: SensorsDataUpdate) => {
      console.log('Datos iniciales recibidos:', data);
      this.updateSensorData(data);
    });
    
    // Actualizaciones de datos
    this.socket.on('sensors:update', (data: SensorsDataUpdate) => {
      this.updateSensorData(data);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket.io desconectado');
      this.connectedSubject.next(false);
    });
    
    this.socket.on('connect_error', (err: any) => {
      console.error('Error de conexión Socket.io:', err.message);
      this.connectedSubject.next(false);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  private updateSensorData(data: SensorsDataUpdate) {
    if (data.temperature) {
      this.temperatureSubject.next(data.temperature);
    }
    
    if (data.humidity) {
      this.humiditySubject.next(data.humidity);
    }
  }

  // Método para obtener datos históricos a través de API REST
  getHistoricalData(sensor: string, hours: number = 24): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historical?sensor=${sensor}&hours=${hours}`);
  }

  // Método para obtener los datos más recientes a través de API REST
  getLatestData(): Observable<SensorsDataUpdate> {
    return this.http.get<SensorsDataUpdate>(`${this.apiUrl}/latest`);
  }

  // ==================== SISTEMA DE POLLING ====================

  /**
   * Inicia el polling para una caja específica
   * @param boxId ID de la caja a monitorear
   * @param interval Intervalo en milisegundos (opcional, por defecto 3000ms)
   */
  startPolling(boxId: number, interval: number = this.pollingInterval): void {
    // Si ya hay polling activo para esta caja, lo detenemos primero
    this.stopPolling(boxId);

    console.log(`🔄 Iniciando polling para caja ${boxId} cada ${interval}ms`);

    const pollingSubscription = timer(0, interval).pipe(
      switchMap(() => this.getPollingData(boxId)),
      retry(3), // Reintentar hasta 3 veces en caso de error
      catchError(error => {
        console.error(`❌ Error en polling para caja ${boxId}:`, error);
        return of(null); // Continuar el polling aunque haya errores
      })
    ).subscribe(data => {
      if (data) {
        this.handlePollingData(data);
      }
    });

    this.pollingSubscriptions.set(boxId, pollingSubscription);
  }

  /**
   * Detiene el polling para una caja específica
   * @param boxId ID de la caja
   */
  stopPolling(boxId: number): void {
    const subscription = this.pollingSubscriptions.get(boxId);
    if (subscription) {
      subscription.unsubscribe();
      this.pollingSubscriptions.delete(boxId);
      console.log(`⏹️ Polling detenido para caja ${boxId}`);
    }
  }

  /**
   * Detiene todo el polling activo
   */
  stopAllPolling(): void {
    this.pollingSubscriptions.forEach((subscription, boxId) => {
      subscription.unsubscribe();
      console.log(`⏹️ Polling detenido para caja ${boxId}`);
    });
    this.pollingSubscriptions.clear();
  }

  /**
   * Obtiene datos de polling para una caja específica
   * @param boxId ID de la caja
   */
  getPollingData(boxId: number): Observable<PollingResponse> {
    return this.http.get<PollingResponse>(`${this.apiUrl}/polling?boxId=${boxId}`);
  }

  /**
   * Verifica si hay polling activo para una caja
   * @param boxId ID de la caja
   */
  isPollingActive(boxId: number): boolean {
    return this.pollingSubscriptions.has(boxId);
  }

  /**
   * Obtiene la lista de cajas con polling activo
   */
  getActivePollingBoxes(): number[] {
    return Array.from(this.pollingSubscriptions.keys());
  }

  /**
   * Cambia el intervalo de polling para una caja
   * @param boxId ID de la caja
   * @param newInterval Nuevo intervalo en milisegundos
   */
  changePollingInterval(boxId: number, newInterval: number): void {
    if (this.isPollingActive(boxId)) {
      this.startPolling(boxId, newInterval);
    }
  }

  /**
   * Maneja los datos recibidos del polling
   * @param data Datos de la respuesta de polling
   */
  private handlePollingData(data: PollingResponse): void {
    // Actualizar temperatura si está disponible
    if (data.sensors.temperature) {
      const tempData: SensorData = {
        current: data.sensors.temperature.value,
        value: data.sensors.temperature.value,
        timestamp: data.sensors.temperature.timestamp
      };
      this.temperatureSubject.next(tempData);
    }

    // Actualizar humedad si está disponible
    if (data.sensors.humidity) {
      const humidityData: SensorData = {
        current: data.sensors.humidity.value,
        value: data.sensors.humidity.value,
        timestamp: data.sensors.humidity.timestamp
      };
      this.humiditySubject.next(humidityData);
    }

    console.log(`📊 Datos de polling actualizados para caja ${data.boxId}:`, {
      temperature: data.sensors.temperature?.value,
      humidity: data.sensors.humidity?.value,
      timestamp: data.timestamp
    });
  }

  /**
   * Obtiene información detallada del estado del polling
   */
  getPollingStatus(): { boxId: number, active: boolean, interval: number }[] {
    return Array.from(this.pollingSubscriptions.keys()).map(boxId => ({
      boxId,
      active: true,
      interval: this.pollingInterval
    }));
  }

  /**
   * Configurar intervalo global de polling
   */
  setGlobalPollingInterval(interval: number): void {
    this.pollingInterval = interval;
    
    // Actualizar polling activo con nuevo intervalo
    const activeBoxes = this.getActivePollingBoxes();
    activeBoxes.forEach(boxId => {
      this.changePollingInterval(boxId, interval);
    });
    
    console.log(`⚙️ Intervalo de polling global actualizado a ${interval}ms para ${activeBoxes.length} cajas`);
  }

  /**
   * Limpia todos los recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    this.stopAllPolling();
    this.disconnect();
  }
}