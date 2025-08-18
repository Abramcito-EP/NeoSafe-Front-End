import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface CreateSafeBoxRequest {
  name: string;
  modelId?: number;
  codeNfc?: string;
  sensorTypes?: string[];
}

export interface SafeBoxResponse {
  id: number;
  name: string;
  modelId: number;
  codeNfc?: string;
  claimCode?: string; // Solo disponible si no está reclamada
  isClaimed: boolean;
  status: string;
  ownerId?: number;
  providerId: number;
  createdAt: string;
  updatedAt: string;
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
  sensors?: any[]; // Solo disponible si está reclamada
}

export interface ClaimBoxRequest {
  claimCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class SafeBoxesService {
  private apiUrl = `${environment.apiUrl}/safe-boxes`;
  
  // Observable para emitir cambios en las cajas
  private boxesSubject = new BehaviorSubject<SafeBoxResponse[]>([]);
  public boxes$ = this.boxesSubject.asObservable();
  
  // Control del polling
  private pollingSubscription?: Subscription;
  private isPolling = false;

  constructor(private http: HttpClient) {}

  getAllBoxes(): Observable<SafeBoxResponse[]> {
    return this.http.get<SafeBoxResponse[]>(this.apiUrl);
  }

  getBoxById(id: number): Observable<SafeBoxResponse> {
    return this.http.get<SafeBoxResponse>(`${this.apiUrl}/${id}`);
  }

  createBox(boxData: CreateSafeBoxRequest): Observable<SafeBoxResponse> {
    return this.http.post<SafeBoxResponse>(this.apiUrl, boxData);
  }

  updateBox(id: number, boxData: Partial<CreateSafeBoxRequest>): Observable<SafeBoxResponse> {
    return this.http.put<SafeBoxResponse>(`${this.apiUrl}/${id}`, boxData);
  }

  deleteBox(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  generateClaimCode(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/generate-claim-code`, {});
  }

  claimBox(claimData: ClaimBoxRequest): Observable<{ message: string, box: SafeBoxResponse }> {
    return this.http.post<{ message: string, box: SafeBoxResponse }>(`${this.apiUrl}/claim`, claimData);
  }

  // Método para iniciar el polling de cajas
  startPolling(intervalMs: number = 5000): void {
    if (this.isPolling) {
      return;
    }

    // Cargar datos inmediatamente al inicio
    this.refreshBoxes();

    this.isPolling = true;
    this.pollingSubscription = interval(intervalMs)
      .pipe(
        switchMap(() => this.getAllBoxes()),
        catchError(error => {
          console.error('Error en polling de cajas:', error);
          return [];
        })
      )
      .subscribe((boxes: SafeBoxResponse[]) => {
        this.boxesSubject.next(boxes);
      });
  }

  // Método para detener el polling
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
    this.isPolling = false;
  }

  // Método para obtener el estado actual de las cajas sin suscripción
  getCurrentBoxes(): SafeBoxResponse[] {
    return this.boxesSubject.getValue();
  }

  // Método para forzar una actualización inmediata
  refreshBoxes(): void {
    this.getAllBoxes().subscribe((boxes: SafeBoxResponse[]) => {
      this.boxesSubject.next(boxes);
    });
  }
}
