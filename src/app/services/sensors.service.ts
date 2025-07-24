import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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
  weight: SensorData | null;
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
  private weightSubject = new BehaviorSubject<SensorData | null>(null);
  
  // Observables públicos
  public temperature$ = this.temperatureSubject.asObservable();
  public humidity$ = this.humiditySubject.asObservable();
  public weight$ = this.weightSubject.asObservable();
  
  // Estado de conexión WebSocket
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

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
    
    if (data.weight) {
      this.weightSubject.next(data.weight);
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
}