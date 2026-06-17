import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { AppNotification } from './models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private baseUrl = 'http://localhost:5010/api';
  private apiUrl = `${this.baseUrl}/notification`;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private pollingSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  fetchNotifications(count: number = 50): Observable<{notifications: AppNotification[], unreadCount: number}> {
    return this.http.get<{notifications: AppNotification[], unreadCount: number}>(`${this.apiUrl}?count=${count}`).pipe(
      tap(res => {
        this.notificationsSubject.next(res.notifications);
        this.unreadCountSubject.next(res.unreadCount);
      }),
      catchError(err => {
        console.error('Error fetching notifications', err);
        return of({notifications: [], unreadCount: 0});
      })
    );
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const notifs = this.notificationsSubject.value;
        const index = notifs.findIndex(n => n.notificationId === notificationId);
        if (index > -1 && !notifs[index].isRead) {
          notifs[index].isRead = true;
          this.notificationsSubject.next([...notifs]);
          this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
        }
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const notifs = this.notificationsSubject.value.map(n => ({...n, isRead: true}));
        this.notificationsSubject.next(notifs);
        this.unreadCountSubject.next(0);
      })
    );
  }

  startPolling(intervalMs: number = 60000) {
    this.fetchNotifications().subscribe();
    this.pollingSubscription = timer(intervalMs, intervalMs)
      .pipe(switchMap(() => this.fetchNotifications()))
      .subscribe();
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}
