import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}
