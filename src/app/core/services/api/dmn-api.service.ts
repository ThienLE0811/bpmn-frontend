import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DmnDecision } from '@core/models/dmn-decision.model';

@Injectable({
  providedIn: 'root',
})
export class DmnApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/dmn-decisions';

  getAll(): Observable<DmnDecision[]> {
    return this.api.get<DmnDecision[]>(this.endpoint);
  }

  getById(id: string): Observable<DmnDecision> {
    return this.api.get<DmnDecision>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<DmnDecision>): Observable<DmnDecision> {
    return this.api.post<DmnDecision>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<DmnDecision>): Observable<DmnDecision> {
    return this.api.put<DmnDecision>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
