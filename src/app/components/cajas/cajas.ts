import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { CajaComponent, CajaData } from '../caja/caja';
import { SensorsService, SensorsDataUpdate } from '../../services/sensors.service';
import { SafeBoxesService, CreateSafeBoxRequest, SafeBoxResponse } from '../../services/safe-boxes.service';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment.development';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, CajaComponent],
  templateUrl: './cajas.html',
  styleUrls: ['./cajas.scss']
})
export class CajasComponent implements OnInit, OnDestroy {
  cajasData: CajaData[] = [];
  isLoading: boolean = true;
  isConnected: boolean = false;
  showAddCajaModal: boolean = false;
  showLoginModal: boolean = false;
  newCajaName: string = '';
  isCreating: boolean = false;
  private subscriptions: Subscription[] = [];

  // Credenciales para login rápido
  loginCredentials = {
    email: 'admin@example.com',
    password: 'password123'
  };
  isLoggingIn = false;

  constructor(
    private sensorsService: SensorsService,
    private safeBoxesService: SafeBoxesService,
    @Inject(AuthService) private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCajasFromAPI();
    this.connectToSensors();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.sensorsService.disconnect();
  }

  private async loadCajasFromAPI() {
    try {
      this.isLoading = true;
      
      // Verificar si estamos autenticados
      if (!this.authService.isAuthenticated()) {
        console.warn('Usuario no autenticado, mostrando modal de login');
        this.showLoginModal = true;
        this.isLoading = false;
        return;
      }
      
      // Cargar cajas desde la API
      const apiBoxes = await this.safeBoxesService.getAllBoxes().toPromise();
      
      if (apiBoxes && apiBoxes.length > 0) {
        // Convertir las cajas de la API al formato del frontend
        this.cajasData = this.convertApiBoxesToCajaData(apiBoxes);
      } else {
        // Si no hay cajas en la API, usar datos mock para desarrollo
        this.initializeMockData();
      }

      // Cargar datos de sensores
      await this.loadInitialSensorData();
      
    } catch (error: any) {
      console.error('Error cargando cajas desde la API:', error);
      
      // Verificar si es un error de autenticación
      if (error.status === 401) {
        console.warn('Error de autenticación, mostrando modal de login');
        this.showLoginModal = true;
        this.authService.removeToken();
      } else {
        console.warn('Error de API, usando datos mock como fallback');
        // Fallback a datos mock si falla la API
        this.initializeMockData();
        await this.loadInitialSensorData();
      }
    } finally {
      this.isLoading = false;
    }
  }

  private convertApiBoxesToCajaData(apiBoxes: SafeBoxResponse[]): CajaData[] {
    return apiBoxes.map(box => ({
      id: `SF-${String(box.id).padStart(3, '0')}`,
      name: box.name,
      location: 'Ubicación por configurar',
      status: 'normal' as const,
      isLocked: true,
      lastAccess: box.updatedAt,
      batteryLevel: 100,
      sensors: {
        nfc: {
          status: 'normal',
          isActive: true,
          lastActivity: box.updatedAt,
          uptime: '0h 0m',
          totalReads: 0,
          signalStrength: 95
        },
        display: {
          status: 'normal',
          pinStatus: 'Configurado',
          lastAccess: box.updatedAt,
          failedAttempts: 0,
          uptime: '0h 0m',
          brightness: 80
        },
        temperature: {
          status: 'normal',
          current: 22.5,
          min: 18.0,
          max: 30.0,
          history: [22.1, 22.3, 22.4, 22.2, 22.5]
        },
        humidity: {
          status: 'normal',
          current: 45,
          min: 30,
          max: 60,
          history: [44, 43, 45, 46, 45]
        },
        lock: {
          status: 'normal',
          isLocked: true,
          attempts: 0,
          lastUnlock: box.updatedAt,
          mechanism: 'Electrónico + Mecánico'
        },
        weight: {
          status: 'normal',
          current: 0,
          baseline: 0,
          threshold: 2.0,
          unit: 'kg',
          hasContent: false,
          lastChange: box.updatedAt
        },
        camera: {
          status: 'normal',
          isRecording: false,
          resolution: '1080p',
          fps: 30,
          storageUsed: 0,
          storageTotal: 100
        }
      }
    }));
  }

  private initializeMockData() {
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
          nfc: { status: 'normal', isActive: true, lastActivity: new Date().toISOString(), uptime: '72h 15m', totalReads: 1250, signalStrength: 95 },
          display: { status: 'normal', brightness: 80, pinStatus: 'Configurado', lastAccess: new Date().toISOString(), failedAttempts: 0, uptime: '72h 15m' },
          temperature: { status: 'normal', current: 0, min: 18.0, max: 30.0, history: [] },
          humidity: { status: 'normal', current: 0, min: 30, max: 60, history: [] },
          lock: { status: 'normal', isLocked: true, attempts: 0, lastUnlock: new Date().toISOString(), mechanism: 'Electrónico + Mecánico' },
          weight: {
            status: 'normal', current: 0, baseline: 45.5, threshold: 2.0, unit: 'kg',
            hasContent: false,
            lastChange: ''
          },
          camera: { status: 'normal', isRecording: false, resolution: '1080p', fps: 30, storageUsed: 65, storageTotal: 100 }
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
          nfc: { status: 'warning', isActive: true, lastActivity: new Date().toISOString(), uptime: '168h 32m', totalReads: 890, signalStrength: 78 },
          display: { status: 'normal', brightness: 60, pinStatus: 'Configurado', lastAccess: new Date(Date.now() - 3600000).toISOString(), failedAttempts: 0, uptime: '168h 32m' },
          temperature: { status: 'normal', current: 0, min: 18.0, max: 30.0, history: [] },
          humidity: { status: 'warning', current: 0, min: 30, max: 60, history: [] },
          lock: { status: 'normal', isLocked: true, attempts: 1, lastUnlock: new Date(Date.now() - 7200000).toISOString(), mechanism: 'Electrónico + Mecánico' },
          weight: {
            status: 'normal', current: 0, baseline: 32.1, threshold: 1.5, unit: 'kg',
            hasContent: false,
            lastChange: ''
          },
          camera: { status: 'normal', isRecording: true, resolution: '720p', fps: 24, storageUsed: 89, storageTotal: 50 }
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
          nfc: { status: 'offline', isActive: false, lastActivity: new Date(Date.now() - 3600000).toISOString(), uptime: '96h 42m', totalReads: 0, signalStrength: 0 },
          display: { status: 'critical', brightness: 10, pinStatus: 'Bloqueado', lastAccess: new Date(Date.now() - 1800000).toISOString(), failedAttempts: 3, uptime: '96h 42m' },
          temperature: { status: 'warning', current: 0, min: 15.0, max: 35.0, history: [] },
          humidity: { status: 'critical', current: 0, min: 20, max: 70, history: [] },
          lock: { status: 'critical', isLocked: false, attempts: 3, lastUnlock: new Date(Date.now() - 1800000).toISOString(), mechanism: 'Solo Electrónico' },
          weight: {
            status: 'warning', current: 0, baseline: 12.3, threshold: 1.0, unit: 'kg',
            hasContent: false,
            lastChange: ''
          },
          camera: { status: 'offline', isRecording: false, resolution: '480p', fps: 15, storageUsed: 95, storageTotal: 32 }
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
    this.loadCajasFromAPI();
  }

  addCaja() {
    this.showAddCajaModal = true;
    this.newCajaName = '';
  }

  closeAddCajaModal() {
    this.showAddCajaModal = false;
    this.newCajaName = '';
    this.isCreating = false;
  }

  async createCaja() {
    if (!this.newCajaName.trim()) {
      return;
    }

    // Debug más detallado del token antes de crear
    console.log('🔍 DEBUG - Estado completo de autenticación:');
    console.log('  - isAuthenticated():', this.authService.isAuthenticated());
    console.log('  - getToken():', this.authService.getToken() ? 'exists' : 'null');
    console.log('  - getCurrentUser():', this.authService.getCurrentUser());
    this.authService.debugTokenInfo();

    // Verificar el usuario actual y su rol
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('🔍 DEBUG - Usuario actual:', currentUser);
      console.log('🔍 DEBUG - Rol del usuario:', currentUser.role?.name || 'Sin rol definido');
      console.log('🔍 DEBUG - ID del rol:', currentUser.role?.id || 'Sin ID de rol');
    }

    // Verificar autenticación antes de crear
    if (!this.authService.isAuthenticated()) {
      alert('Debes estar autenticado para crear una caja');
      this.showLoginModal = true;
      return;
    }

    this.isCreating = true;

    try {
      // Preparar datos para la API - Ajustar a la nueva estructura
      const newBoxData: CreateSafeBoxRequest = {
        name: this.newCajaName.trim(),
        modelId: 1, // ID del modelo por defecto
        sensorTypes: ['temperature', 'humidity', 'weight']
      };

      console.log('📤 Enviando datos a la API:', newBoxData);
      console.log('📤 URL completa:', `${environment.apiUrl}/safe-boxes`);
      console.log('📤 Token que se enviará:', this.authService.getToken()?.substring(0, 30) + '...');

      // Crear caja en la API
      const createdBox = await this.safeBoxesService.createBox(newBoxData).toPromise();
      
      if (createdBox) {
        console.log('✅ Caja creada exitosamente:', createdBox);
        
        // Convertir la respuesta de la API al formato del frontend
        const newCajaData: CajaData = {
          id: `SF-${String(createdBox.id).padStart(3, '0')}`,
          name: createdBox.name,
          location: 'Ubicación por configurar',
          status: 'normal',
          isLocked: true,
          lastAccess: createdBox.createdAt,
          batteryLevel: 100,
          sensors: {
            nfc: {
              status: 'normal',
              isActive: true,
              lastActivity: createdBox.createdAt,
              uptime: '0h 0m',
              totalReads: 0,
              signalStrength: 95
            },
            display: {
              status: 'normal',
              pinStatus: 'Configurado',
              lastAccess: createdBox.createdAt,
              failedAttempts: 0,
              uptime: '0h 0m',
              brightness: 80
            },
            temperature: {
              status: 'normal',
              current: 22.5,
              min: 18.0,
              max: 30.0,
              history: [22.1, 22.3, 22.4, 22.2, 22.5]
            },
            humidity: {
              status: 'normal',
              current: 45,
              min: 30,
              max: 60,
              history: [44, 43, 45, 46, 45]
            },
            lock: {
              status: 'normal',
              isLocked: true,
              attempts: 0,
              lastUnlock: createdBox.createdAt,
              mechanism: 'Electrónico + Mecánico'
            },
            weight: {
              status: 'normal',
              current: 0,
              baseline: 0,
              threshold: 2.0,
              unit: 'kg',
              hasContent: false,
              lastChange: createdBox.createdAt
            },
            camera: {
              status: 'normal',
              isRecording: false,
              resolution: '1080p',
              fps: 30,
              storageUsed: 0,
              storageTotal: 100
            }
          }
        };

        // Agregar la nueva caja al array local
        this.cajasData.push(newCajaData);
        alert(`¡Caja creada exitosamente!\nCódigo de reclamo: ${createdBox.claimCode}`);
      }

    } catch (error: any) {
      console.error('❌ Error detallado al crear la caja:', error);
      console.error('❌ Status:', error.status);
      console.error('❌ StatusText:', error.statusText);
      console.error('❌ Error body:', error.error);
      console.error('❌ Headers:', error.headers);
      
      let errorMessage = 'Error desconocido al crear la caja';
      
      if (error.status === 401) {
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        this.authService.removeToken();
        this.showLoginModal = true;
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para crear cajas de seguridad. Solo administradores y proveedores pueden crear cajas.';
        console.error('❌ Error de permisos - necesitas rol de admin o provider');
        
        // Mostrar información del usuario actual
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          console.error('❌ Usuario actual:', currentUser.name, currentUser.email);
          console.error('❌ Rol actual:', currentUser.role?.name || 'Sin rol definido');
          console.error('❌ ID del rol:', currentUser.role?.id || 'Sin ID de rol');
        }
      } else if (error.status === 400) {
        errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        if (error.error?.errors) {
          console.error('❌ Errores de validación:', error.error.errors);
          // Extraer el primer error de validación para mostrarlo al usuario
          const firstError = Object.values(error.error.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        }
      } else if (error.status === 422) {
        errorMessage = 'Error de validación en los datos enviados.';
        if (error.error?.errors) {
          console.error('❌ Errores de validación 422:', error.error.errors);
          const firstError = Object.values(error.error.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        }
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      alert(errorMessage);
    } finally {
      this.isCreating = false;
      this.closeAddCajaModal();
    }
  }

  getActiveSensors() {
    return this.cajasData.reduce((total, caja) => {
      return total + Object.values(caja.sensors).filter(sensor => 
        sensor.status === 'normal' || sensor.status === 'warning'
      ).length;
    }, 0);
  }

  // Método temporal para testing - remover en producción
  private ensureAuthToken() {
    if (!this.authService.getToken()) {
      // Crear un token temporal para desarrollo
      const tempToken = 'temp-token-for-development-' + Date.now();
      console.log('🔧 DESARROLLO: Creando token temporal:', tempToken);
      this.authService.setToken(tempToken);
      
      // Mostrar advertencia en consola
      console.warn('⚠️ USANDO TOKEN TEMPORAL PARA DESARROLLO');
      console.warn('⚠️ En producción, el usuario debe hacer login real');
    }
  }

  // Método para login rápido con credenciales que sean admin/provider
  async quickLogin() {
    this.isLoggingIn = true;
    
    try {
      console.log('🔑 Intentando login con:', this.loginCredentials);
      const response = await this.authService.login(this.loginCredentials).toPromise();
      
      if (response && response.token) {
        console.log('✅ Login exitoso:', response);
        console.log('✅ Usuario logueado:', response.user);
        console.log('✅ Rol del usuario:', response.user?.role?.name || 'Sin rol definido');
        console.log('✅ ID del rol:', response.user?.role?.id || 'Sin ID de rol');
        
        this.authService.setToken(response.token);
        this.showLoginModal = false;
        
        // Verificar que el usuario tenga permisos adecuados
        if (response.user?.role?.name && ['admin', 'provider'].includes(response.user.role.name)) {
          console.log('✅ Usuario con permisos adecuados para crear cajas');
        } else {
          console.warn('⚠️ Usuario sin permisos para crear cajas. Rol:', response.user?.role?.name || 'Sin rol definido');
          alert('Tu usuario no tiene permisos para crear cajas. Necesitas ser administrador o proveedor.');
        }
        
        // Recargar datos después del login
        await this.loadCajasFromAPI();
      } else {
        console.error('❌ Respuesta de login inválida:', response);
        alert('Error: No se recibió token del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      if (error.status === 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.status === 422) {
        errorMessage = 'Datos de login inválidos';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      alert(errorMessage);
    } finally {
      this.isLoggingIn = false;
    }
  }

  closeLoginModal() {
    this.showLoginModal = false;
    // Usar datos mock si no se quiere hacer login
    this.initializeMockData();
  }
}

