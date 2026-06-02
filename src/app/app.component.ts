import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

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
}
