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

  constructor(
    private sensorsService: SensorsService,
    private safeBoxesService: SafeBoxesService,
    @Inject(AuthService) private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCajasFromAPI();
    // En lugar de conectar WebSocket, iniciar polling
    this.initializePolling();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Detener polling en lugar de WebSocket
    this.sensorsService.stopAllPolling();
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

      let cajasData: CajaData[] = [];
      if (apiBoxes && apiBoxes.length > 0) {
        // Convertir las cajas de la API al formato del frontend
        cajasData = this.convertApiBoxesToCajaData(apiBoxes);
      }

      // Filtrar según el rol: admin/proveedor solo ven cajas no reclamadas
      const currentUser = this.authService.getCurrentUser();
      const roleName = currentUser?.role?.name;
      if (roleName === 'admin' || roleName === 'provider') {
        this.cajasData = cajasData.filter(caja => !caja.isClaimed);
      } else {
        this.cajasData = cajasData;
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
        console.warn('Error de API, no se pueden cargar las cajas');
        // No usar datos mock, dejar arreglo vacío
        this.cajasData = [];
      }
    } finally {
      this.isLoading = false;
    }
  }

  private convertApiBoxesToCajaData(apiBoxes: SafeBoxResponse[]): CajaData[] {
    return apiBoxes.map(box => {
      const boxId = `SF-${String(box.id).padStart(3, '0')}`;
      const isCaja1 = boxId === 'SF-001';

      return {
        id: boxId,
        name: box.name,
        location: 'Ubicación por configurar',
        status: isCaja1 ? 'normal' as const : 'offline' as const,
        isLocked: true,
        lastAccess: box.updatedAt,
        batteryLevel: isCaja1 ? 100 : 0,
        // Información de reclamo
        isClaimed: box.isClaimed,
        claimCode: box.claimCode,
        owner: box.owner,
        provider: box.provider,
        sensors: isCaja1 ? {
          // Solo la caja SF-001 tiene sensores y cámara funcionales
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
          camera: {
            status: 'normal',
            isRecording: false,
            resolution: '1080p',
            fps: 30,
            storageUsed: 0,
            storageTotal: 100
          }
        } : {
          // Las demás cajas no tienen sensores ni cámara funcionales
          temperature: {
            status: 'offline',
            current: 0,
            min: 18.0,
            max: 30.0,
            history: [0, 0, 0, 0, 0]
          },
          humidity: {
            status: 'offline',
            current: 0,
            min: 30,
            max: 60,
            history: [0, 0, 0, 0, 0]
          },
          camera: {
            status: 'offline',
            isRecording: false,
            resolution: 'N/A',
            fps: 0,
            storageUsed: 0,
            storageTotal: 0
          }
        }
      };
    });
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

  /**
   * Inicializa el sistema de polling solo para la caja 1
   */
  private initializePolling() {
    // Esperar a que las cajas se carguen antes de iniciar polling
    if (this.cajasData.length === 0) {
      // Reintentar después de un momento si no hay cajas cargadas
      setTimeout(() => this.initializePolling(), 1000);
      return;
    }

    console.log('🔄 Inicializando sistema de polling solo para caja 1');

    // Iniciar polling SOLO para la caja 1 (ID: SF-001)
    const caja1 = this.cajasData.find(caja => caja.id === 'SF-001');
    if (caja1) {
      this.sensorsService.startPolling(1, 5000); // Polling cada 5 segundos solo para caja 1
      console.log('✅ Polling iniciado para caja 1');
    }

    // Suscribirse a las actualizaciones de sensores (solo afectará a caja 1)
    this.subscriptions.push(
      this.sensorsService.temperature$.subscribe(data => {
        if (data) this.updateTemperatureInCaja1(data);
      })
    );

    this.subscriptions.push(
      this.sensorsService.humidity$.subscribe(data => {
        if (data) this.updateHumidityInCaja1(data);
      })
    );

    // Simular estado de conexión para polling
    this.isConnected = true;
  }

  /**
   * Extrae el ID numérico de un ID de caja con formato SF-001
   */
  private extractNumericId(cajaId: string): number | null {
    const match = cajaId.match(/SF-(\d+)/);
    return match ? parseInt(match[1]) : null;
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

  // Métodos específicos para actualizar solo la caja 1
  private updateTemperatureInCaja1(data: any) {
    const caja1 = this.cajasData.find(caja => caja.id === 'SF-001');
    if (caja1) {
      caja1.sensors.temperature.current = data.value;
      caja1.sensors.temperature.history = [
        ...caja1.sensors.temperature.history.slice(-4),
        data.value
      ];
      caja1.sensors.temperature.status = this.getSensorStatus(
        data.value,
        caja1.sensors.temperature.min,
        caja1.sensors.temperature.max
      );
      caja1.status = this.calculateOverallStatus(caja1);
    }
  }

  private updateHumidityInCaja1(data: any) {
    const caja1 = this.cajasData.find(caja => caja.id === 'SF-001');
    if (caja1) {
      caja1.sensors.humidity.current = data.value;
      caja1.sensors.humidity.history = [
        ...caja1.sensors.humidity.history.slice(-4),
        data.value
      ];
      caja1.sensors.humidity.status = this.getSensorStatus(
        data.value,
        caja1.sensors.humidity.min,
        caja1.sensors.humidity.max
      );
      caja1.status = this.calculateOverallStatus(caja1);
    }
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
    // Detener polling actual
    this.sensorsService.stopAllPolling();
    
    // Recargar cajas desde API
    this.loadCajasFromAPI();
    
    // Reinicializar polling después de cargar las cajas
    setTimeout(() => {
      this.initializePolling();
    }, 1000);
  }

  addCaja() {
    // Verificar si el usuario puede crear cajas
    if (!this.canCreateBoxes()) {
      const currentUser = this.authService.getCurrentUser();
      const userRole = currentUser?.role?.name || 'sin rol definido';
      alert(`No tienes permisos para crear cajas de seguridad.\nTu rol actual: ${userRole}\nSolo administradores y proveedores pueden crear cajas.`);
      return;
    }

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

    // Verificar permisos antes de crear
    if (!this.canCreateBoxes()) {
      const currentUser = this.authService.getCurrentUser();
      const userRole = currentUser?.role?.name || 'sin rol definido';
      alert(`No tienes permisos para crear cajas de seguridad.\nTu rol actual: ${userRole}\nSolo administradores y proveedores pueden crear cajas.`);
      this.closeAddCajaModal();
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
          status: 'offline', // Nuevas cajas inician como offline excepto caja 1
          isLocked: true,
          lastAccess: createdBox.createdAt,
          batteryLevel: 0, // Nuevas cajas inician con batería en 0 excepto caja 1
          isClaimed: createdBox.isClaimed,
          claimCode: createdBox.claimCode,
          provider: createdBox.provider,
          sensors: {
            temperature: {
              status: 'offline',
              current: 0,
              min: 18.0,
              max: 30.0,
              history: [0, 0, 0, 0, 0]
            },
            humidity: {
              status: 'offline',
              current: 0,
              min: 30,
              max: 60,
              history: [0, 0, 0, 0, 0]
            },
            camera: {
              status: 'offline', // Cámara no funcional para nuevas cajas
              isRecording: false,
              resolution: 'N/A',
              fps: 0,
              storageUsed: 0,
              storageTotal: 0
            }
            // Sin lock por defecto
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

  closeLoginModal() {
    this.showLoginModal = false;
    // Sin datos mock, permanecer en estado sin cajas hasta hacer login
  }

  // Verificar si el usuario actual puede crear cajas
  canCreateBoxes(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.role) {
      return false;
    }
    
    // Solo permitir a administradores y proveedores crear cajas
    // Los usuarios con rol 'user' no pueden crear cajas
    return currentUser.role.name !== 'user';
  }
}

