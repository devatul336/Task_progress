import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from './shared/auth.service';

import { NotificationService } from './shared/notification.service';
import { AppNotification } from './shared/models/interfaces';
import { ProgressTrackerService } from './shared/progress-tracker.service';
import { GlobalFilterService } from './shared/global-filter.service';
import { ThemeService } from './shared/theme.service';

interface NavItem { label: string; icon: string; route: string; badge?: number; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterModule, MatToolbarModule,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule,
    MatBadgeModule, MatTooltipModule, MatProgressBarModule, MatMenuModule,
    MatCheckboxModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  sidenavOpen = true;

  navGroups = [
    {
      label: 'Dashboards',
      items: [
        { label: 'My Dashboard', icon: 'person', route: '/dashboard/employee' },
        { label: 'Team Dashboard', icon: 'groups', route: '/dashboard/manager' },
        { label: 'Organization', icon: 'corporate_fare', route: '/dashboard/organization' },
      ]
    },
    {
      label: 'Work',
      items: [
        { label: 'Epics', icon: 'flash_on', route: '/epics' },
        { label: 'Task Board', icon: 'view_kanban', route: '/tasks/board' },
        { label: 'Projects', icon: 'account_tree', route: '/projects' },
      ]
    },
    {
      label: 'Performance',
      items: [
        { label: 'KPIs', icon: 'flag', route: '/kpi' },
        { label: 'Goals', icon: 'emoji_events', route: '/goals' },
        { label: 'Reviews', icon: 'star_rate', route: '/reviews' },
      ]
    },
    {
      label: 'Settings',
      items: [
        { label: 'Task Statuses', icon: 'settings', route: '/settings/task-statuses' }
      ]
    }
  ];

  filteredNavGroups: any[] = [];
  userRole: string = '';
  userName: string = '';
  userEmail: string = '';
  isAuthReady: boolean = false;
  isAdmin: boolean = false;
  isManager: boolean = false;

  // Dropdown states
  showUserDropdown = false;
  signoutHover = false;
  userDetails = {
    name: '',
    email: '',
    role: '',
    department: '',
    designation: ''
  };

  showNotificationDropdown = false;
  unreadCount = 0;
  notifications: AppNotification[] = [];
  
  // Search state
  employees: any[] = [];
  filterSearchText = '';
  filterTimeFrame: string | null = null;
  filterEmployeeIds: string[] = [];
  
  isDarkTheme = false;
  currentThemeMode = 'light';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private trackerService: ProgressTrackerService,
    private globalFilterService: GlobalFilterService,
    public themeService: ThemeService
  ) { }

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe(isDark => this.isDarkTheme = isDark);
    this.themeService.currentMode$.subscribe(mode => this.currentThemeMode = mode);
    
    this.globalFilterService.filterState$.subscribe(state => {
      this.filterSearchText = state.searchText;
      this.filterTimeFrame = state.timeFrame;
      this.filterEmployeeIds = state.employeeIds;
    });
    // Check URL for token first (if opened in new tab from shell)
    const urlParams = new URLSearchParams(window.location.search);
    let tokenFromUrl = urlParams.get('token');
    let roleFromUrl = urlParams.get('userRole');
    let nameFromUrl = urlParams.get('userName');
    let emailFromUrl = urlParams.get('userEmail');
    let employeeIdFromUrl = urlParams.get('employeeId');

    // Also check hash routing query params (e.g. /#/dashboard/employee?token=...)
    if (!tokenFromUrl && window.location.hash.includes('?')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      tokenFromUrl = hashParams.get('token');
      roleFromUrl = roleFromUrl || hashParams.get('userRole');
      nameFromUrl = nameFromUrl || hashParams.get('userName');
      emailFromUrl = emailFromUrl || hashParams.get('userEmail');
      employeeIdFromUrl = employeeIdFromUrl || hashParams.get('employeeId');
    }

    if (tokenFromUrl) {
      sessionStorage.setItem('token', tokenFromUrl);
      localStorage.setItem('token', tokenFromUrl);
    }
    if (roleFromUrl) sessionStorage.setItem('userRole', roleFromUrl);
    if (nameFromUrl) sessionStorage.setItem('userName', nameFromUrl);
    if (emailFromUrl) sessionStorage.setItem('userEmail', emailFromUrl);
    if (employeeIdFromUrl) localStorage.setItem('employeeId', employeeIdFromUrl);

    // Clean up the URL to remove the token and user params
    if (tokenFromUrl || roleFromUrl || employeeIdFromUrl) {
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      let newHash = window.location.hash;
      if (newHash.includes('?token=')) {
        newHash = newHash.split('?')[0]; // simple strip
      } else if (newHash.includes('?')) {
        newHash = newHash.split('?')[0]; // strip other params if added
      }
      window.history.replaceState({}, document.title, newUrl + newHash);
    }

    // Listen for messages from parent shell (e.g., to sync token)
    window.addEventListener('message', (event) => {
      if (!event.data) return;

      if (event.data.type === 'SET_TOKEN') {
        const { token, user, tenantSchema } = event.data;
        if (token) {
          console.log('[ProgressTracker_MFE] Received token from parent shell');
          const tokenStr = typeof token === 'string' ? token : JSON.stringify(token);
          sessionStorage.setItem('token', tokenStr);
          localStorage.setItem('token', tokenStr);

          if (user) {
            const userStr = typeof user === 'string' ? user : JSON.stringify(user);
            sessionStorage.setItem('user', userStr);
            try {
              const parsedUser = JSON.parse(userStr);
              if (parsedUser.employeId) {
                localStorage.setItem('employeeId', parsedUser.employeId);
              } else if (parsedUser.EmployeeId) {
                localStorage.setItem('employeeId', parsedUser.EmployeeId);
              }
            } catch (e) { }
          }

          // Re-init auth info after receiving token
          const userInfo = this.authService.getUserInfo();
          this.userRole = this.authService.getUserRole();
          this.userName = userInfo.name;
          this.userEmail = userInfo.email;
          this.filterNavItems();

          // Also update userDetails which is used in the UI dropdown
          this.userDetails.name = this.userName;
          this.userDetails.email = this.userEmail;
          this.userDetails.role = this.userRole;

          this.isAuthReady = true;
        }
      }
    });

    // Request token from parent on load
    if (window !== window.parent) {
      window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*');
    }

    const userInfo = this.authService.getUserInfo();
    this.userRole = this.authService.getUserRole();
    this.userName = sessionStorage.getItem('userName') || userInfo.name;
    this.userEmail = sessionStorage.getItem('userEmail') || userInfo.email;

    this.userDetails = {
      name: this.userName,
      email: this.userEmail,
      role: this.userRole,
      department: '',
      designation: ''
    };

    this.filterNavItems();

    if (this.authService.getToken() || window === window.parent) {
      this.isAuthReady = true;
      this.initNotifications();
    }
  }

  private initNotifications() {
    this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count);
    this.notificationService.notifications$.subscribe(notifs => this.notifications = notifs);
    this.notificationService.startPolling();
    
    // Load employees for search dropdown
    this.trackerService.getEmployees().subscribe(emps => {
      this.employees = emps;
    });
  }

  // Filter Methods
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.globalFilterService.updateSearchText(input.value);
  }

  setTimeFrame(timeframe: string | null) {
    this.globalFilterService.updateTimeFrame(timeframe);
  }

  toggleAssignee(employeeId: string) {
    this.globalFilterService.toggleEmployee(employeeId);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get userInitials(): string {
    const source = (this.userName || '').trim();
    if (!source) return '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const firstInitial = parts[0]?.charAt(0) ?? '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : '';
    const initials = `${firstInitial}${lastInitial}`.trim() || firstInitial;
    return initials.toUpperCase() || '?';
  }

  onUserClick(event: Event) {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotificationDropdown = false;
  }

  onNotificationBellClick(event: Event) {
    event.stopPropagation();
    this.showNotificationDropdown = !this.showNotificationDropdown;
    this.showUserDropdown = false;
  }

  markNotificationAsRead(notif: AppNotification, event: Event) {
    event.stopPropagation();
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.notificationId).subscribe();
    }
  }

  markAllNotificationsAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.user-profile-dropdown')) {
      this.showUserDropdown = false;
    }
    if (!target.closest('.notification-bell') && !target.closest('.notification-dropdown')) {
      this.showNotificationDropdown = false;
    }
  }

  onSignoutHover(isHover: boolean) {
    this.signoutHover = isHover;
  }


  logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.close(); // Close the tab
  }

  filterNavItems() {
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';
    this.isAdmin = role === 'Admin' || role === 'HR' || this.authService.isAdminOrHR();
    this.isManager = role === 'Manager' || this.authService.isManager();

    this.filteredNavGroups = this.navGroups.map(group => {
      // Filter out items based on user role
      const filteredItems = group.items.filter(item => {
        if (this.isAdmin) {
          return true; // Admin/HR sees everything
        }

        // List of routes restricted to ONLY Admin/HR
        const adminRoutes = [
          '/dashboard/organization',
          '/settings/task-statuses'
        ];

        // List of routes restricted to Manager AND Admin/HR
        const managerRoutes = [
          '/dashboard/manager'
        ];

        if (adminRoutes.includes(item.route)) {
          return false; // Not admin, hide admin routes
        }

        if (managerRoutes.includes(item.route) && !this.isManager) {
          return false; // Not manager or admin, hide manager routes
        }

        return true; // Show for everyone else
      });

      return {
        ...group,
        items: filteredItems
      };
    }).filter(group => group.items.length > 0); // Remove empty groups
  }
}
