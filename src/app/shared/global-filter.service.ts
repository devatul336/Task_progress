import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GlobalFilterState {
  searchText: string;
  timeFrame: string | null; // 'today', 'yesterday', 'past_7', 'past_30', 'past_year', null for 'any time'
  employeeIds: string[]; // List of employee IDs to filter by
}

@Injectable({
  providedIn: 'root'
})
export class GlobalFilterService {

  private filterStateSubject = new BehaviorSubject<GlobalFilterState>({
    searchText: '',
    timeFrame: null,
    employeeIds: []
  });

  filterState$ = this.filterStateSubject.asObservable();

  constructor() { }

  updateSearchText(text: string) {
    const currentState = this.filterStateSubject.value;
    this.filterStateSubject.next({ ...currentState, searchText: text });
  }

  updateTimeFrame(timeFrame: string | null) {
    const currentState = this.filterStateSubject.value;
    this.filterStateSubject.next({ ...currentState, timeFrame });
  }

  toggleEmployee(employeeId: string) {
    const currentState = this.filterStateSubject.value;
    let newEmployeeIds = [...currentState.employeeIds];
    
    if (newEmployeeIds.includes(employeeId)) {
      newEmployeeIds = newEmployeeIds.filter(id => id !== employeeId);
    } else {
      newEmployeeIds.push(employeeId);
    }
    
    this.filterStateSubject.next({ ...currentState, employeeIds: newEmployeeIds });
  }
  
  clearFilters() {
    this.filterStateSubject.next({
      searchText: '',
      timeFrame: null,
      employeeIds: []
    });
  }
}
