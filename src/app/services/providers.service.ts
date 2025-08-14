import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Provider {
  id: number;
  name: string;
  lastName: string;
  email: string;
  birthDate: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProvidersResponse {
  message: string;
  providers: Provider[];
  total: number;
}

export interface ProviderResponse {
  message: string;
  provider: Provider;
}

export interface UpdateProviderData {
  name?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
}

export interface DeleteProviderResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {
  private apiUrl = `${environment.apiUrl}/providers`;

  constructor(private http: HttpClient) { }

  private getHttpHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener todos los proveedores
   */
  getAllProviders(): Observable<ProvidersResponse> {
    return this.http.get<ProvidersResponse>(this.apiUrl, {
      headers: this.getHttpHeaders()
    });
  }

  /**
   * Obtener un proveedor específico por ID
   */
  getProviderById(id: number): Observable<ProviderResponse> {
    return this.http.get<ProviderResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHttpHeaders()
    });
  }

  /**
   * Actualizar un proveedor
   */
  updateProvider(id: number, data: UpdateProviderData): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHttpHeaders()
    });
  }

  /**
   * Eliminar un proveedor
   */
  deleteProvider(id: number): Observable<DeleteProviderResponse> {
    return this.http.delete<DeleteProviderResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHttpHeaders()
    });
  }
}
