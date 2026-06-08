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
import { AuthService } from './shared/auth.service';

interface NavItem { label: string; icon: string; route: string; badge?: number; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterModule, MatToolbarModule,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule,
    MatBadgeModule, MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
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
    }
  ];

  filteredNavGroups: any[] = [];
  userRole: string = '';
  userName: string = '';
  userEmail: string = '';

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

  constructor(private authService: AuthService) {}

  ngOnInit() {
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
          
          // Re-init auth info after receiving token
          const userInfo = this.authService.getUserInfo();
          this.userRole = userInfo.role;
          this.userName = userInfo.name;
          this.userEmail = userInfo.email;
          this.filterNavItems();
        }
      }
    });

    // Request token from parent on load
    if (window !== window.parent) {
      window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*');
    }

    const userInfo = this.authService.getUserInfo();
    this.userRole = sessionStorage.getItem('userRole') || userInfo.role;
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
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.user-profile-dropdown')) {
      this.showUserDropdown = false;
    }
  }

  onSignoutHover(hover: boolean) {
    this.signoutHover = hover;
  }

  logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.close(); // Close the tab
  }

  filterNavItems() {
    const isAdmin = this.authService.isAdminOrHR();
    const isManager = this.authService.isManager();
    
    this.filteredNavGroups = this.navGroups.map(group => {
      // Filter out items based on user role
      const filteredItems = group.items.filter(item => {
        if (isAdmin) {
          return true; // Admin/HR sees everything
        }

        // List of routes restricted to ONLY Admin/HR
        const adminRoutes = [
          '/dashboard/organization',
          '/projects'
        ];

        // List of routes restricted to Manager AND Admin/HR
        const managerRoutes = [
          '/dashboard/manager'
        ];

        if (adminRoutes.includes(item.route)) {
          return false; // Not admin, hide admin routes
        }

        if (managerRoutes.includes(item.route) && !isManager) {
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
