import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BpmnProcess } from '@core/models/bpmn-process.model';

@Injectable({
  providedIn: 'root',
})
export class BpmnApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/bpmn-processes';

  getAll(): Observable<BpmnProcess[]> {
    return this.api.get<BpmnProcess[]>(this.endpoint);
  }

  getById(id: string): Observable<BpmnProcess> {
    return this.api.get<BpmnProcess>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<BpmnProcess>): Observable<BpmnProcess> {
    return this.api.post<BpmnProcess>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<BpmnProcess>): Observable<BpmnProcess> {
    return this.api.put<BpmnProcess>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
