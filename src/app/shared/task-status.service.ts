import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { TaskStatusMaster } from './models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class TaskStatusService {
  private baseUrl = 'http://localhost:5010/api/TaskStatusMaster';
  private statusesSubject = new BehaviorSubject<TaskStatusMaster[]>([]);
  public statuses$ = this.statusesSubject.asObservable();
  private hasLoaded = false;

  constructor(private http: HttpClient) {}

  loadStatuses(): Observable<TaskStatusMaster[]> {
    return this.http.get<TaskStatusMaster[]>(this.baseUrl).pipe(
      tap(statuses => {
        this.statusesSubject.next(statuses);
        this.hasLoaded = true;
      })
    );
  }

  getCategories(): Observable<{value: number, label: string}[]> {
    return this.http.get<{value: number, label: string}[]>(`${this.baseUrl}/categories`);
  }

  getStatuses(): TaskStatusMaster[] {
    return this.statusesSubject.value;
  }

  ensureLoaded() {
    if (!this.hasLoaded) {
      this.loadStatuses().subscribe();
    }
  }

  getStatusName(statusId: number): string {
    const status = this.getStatuses().find(s => s.taskStatusId === statusId);
    return status ? status.name : 'Unknown';
  }

  getStatusColorClass(statusId: number): string {
    const status = this.getStatuses().find(s => s.taskStatusId === statusId);
    return status ? status.colorClass : 'bg-gray-100 text-gray-800';
  }

  createStatus(status: Partial<TaskStatusMaster>): Observable<TaskStatusMaster> {
    return this.http.post<TaskStatusMaster>(this.baseUrl, status).pipe(
      tap(() => this.loadStatuses().subscribe())
    );
  }

  updateStatus(id: number, status: Partial<TaskStatusMaster>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, status).pipe(
      tap(() => this.loadStatuses().subscribe())
    );
  }

  deleteStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.loadStatuses().subscribe())
    );
  }
}
