const fs = require('fs');
const file = 'c:/Users/user18/Frontend/ProgressTracker_MFE/src/app/goals/goal-list/goal-list.component.html';
let content = fs.readFileSync(file, 'utf8');

const regex = /<!-- KANBAN VIEW -->[\s\S]*?<!-- TABLE VIEW -->/;

const newKanban = `<!-- KANBAN VIEW -->
    <div class="kanban-board" *ngIf="currentView === 'kanban'" cdkDropListGroup>
      
      <!-- Not Started Column -->
      <div class="kanban-column col-todo">
        <div class="col-header">
          <div class="col-title">NOT STARTED <span class="badge">{{ kanbanNotStarted.length }}</span></div>
        </div>
        <div class="column-content" cdkDropList id="col-1" [cdkDropListData]="kanbanNotStarted"
          (cdkDropListDropped)="drop($event, 1)">
          <div class="task-card" *ngFor="let item of kanbanNotStarted" cdkDrag [cdkDragData]="item"
            [ngClass]="getPriorityClass(item.priority)">
            <div class="card-priority-indicator"></div>
            <div class="card-content-jira">
              <div class="card-header-jira">
                <span class="card-title-jira" [routerLink]="['/goals', item.employeeGoalId]"
                  style="cursor: pointer;">{{ item.title }}</span>
              </div>
              <div class="card-footer-jira">
                <div class="card-type-key" [routerLink]="['/goals', item.employeeGoalId]" style="cursor: pointer;">
                  <mat-icon class="jira-type-icon" style="color: #4f46e5;">flag</mat-icon>
                  <span class="jira-key">GOL-{{ item.employeeGoalId }}</span>
                  <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px;">{{ item.progressPercentage }}%</span>
                </div>
                <div class="avatar-stack">
                  <div class="mini-avatar" *ngFor="let m of item.members.slice(0,3)"
                    [style.background]="getAssigneeColor(m.employeeId)"
                    [matTooltip]="m.employeeName">
                    {{ getAssigneeInitials(m.employeeId) }}
                  </div>
                  <div class="mini-avatar" *ngIf="item.members.length > 3" style="background: #e2e8f0; color: #475569;">
                    +{{ item.members.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- In Progress Column -->
      <div class="kanban-column col-progress">
        <div class="col-header">
          <div class="col-title">IN PROGRESS <span class="badge">{{ kanbanInProgress.length }}</span></div>
        </div>
        <div class="column-content" cdkDropList id="col-2" [cdkDropListData]="kanbanInProgress"
          (cdkDropListDropped)="drop($event, 2)">
          <div class="task-card" *ngFor="let item of kanbanInProgress" cdkDrag [cdkDragData]="item"
            [ngClass]="getPriorityClass(item.priority)">
            <div class="card-priority-indicator"></div>
            <div class="card-content-jira">
              <div class="card-header-jira">
                <span class="card-title-jira" [routerLink]="['/goals', item.employeeGoalId]"
                  style="cursor: pointer;">{{ item.title }}</span>
              </div>
              <div class="card-footer-jira">
                <div class="card-type-key" [routerLink]="['/goals', item.employeeGoalId]" style="cursor: pointer;">
                  <mat-icon class="jira-type-icon" style="color: #4f46e5;">flag</mat-icon>
                  <span class="jira-key">GOL-{{ item.employeeGoalId }}</span>
                  <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px;">{{ item.progressPercentage }}%</span>
                </div>
                <div class="avatar-stack">
                  <div class="mini-avatar" *ngFor="let m of item.members.slice(0,3)"
                    [style.background]="getAssigneeColor(m.employeeId)"
                    [matTooltip]="m.employeeName">
                    {{ getAssigneeInitials(m.employeeId) }}
                  </div>
                  <div class="mini-avatar" *ngIf="item.members.length > 3" style="background: #e2e8f0; color: #475569;">
                    +{{ item.members.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achieved Column -->
      <div class="kanban-column col-done">
        <div class="col-header">
          <div class="col-title">ACHIEVED <span class="badge">{{ kanbanCompleted.length }}</span></div>
        </div>
        <div class="column-content" cdkDropList id="col-3" [cdkDropListData]="kanbanCompleted"
          (cdkDropListDropped)="drop($event, 3)">
          <div class="task-card" *ngFor="let item of kanbanCompleted" cdkDrag [cdkDragData]="item"
            [ngClass]="getPriorityClass(item.priority)">
            <div class="card-priority-indicator"></div>
            <div class="card-content-jira">
              <div class="card-header-jira">
                <span class="card-title-jira" [routerLink]="['/goals', item.employeeGoalId]"
                  style="cursor: pointer;">{{ item.title }}</span>
              </div>
              <div class="card-footer-jira">
                <div class="card-type-key" [routerLink]="['/goals', item.employeeGoalId]" style="cursor: pointer;">
                  <mat-icon class="jira-type-icon" style="color: #4f46e5;">flag</mat-icon>
                  <span class="jira-key">GOL-{{ item.employeeGoalId }}</span>
                  <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px;">{{ item.progressPercentage }}%</span>
                </div>
                <div class="avatar-stack">
                  <div class="mini-avatar" *ngFor="let m of item.members.slice(0,3)"
                    [style.background]="getAssigneeColor(m.employeeId)"
                    [matTooltip]="m.employeeName">
                    {{ getAssigneeInitials(m.employeeId) }}
                  </div>
                  <div class="mini-avatar" *ngIf="item.members.length > 3" style="background: #e2e8f0; color: #475569;">
                    +{{ item.members.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Missed Column -->
      <div class="kanban-column col-rejected">
        <div class="col-header">
          <div class="col-title">MISSED <span class="badge">{{ kanbanRejected.length }}</span></div>
        </div>
        <div class="column-content" cdkDropList id="col-4" [cdkDropListData]="kanbanRejected"
          (cdkDropListDropped)="drop($event, 4)">
          <div class="task-card" *ngFor="let item of kanbanRejected" cdkDrag [cdkDragData]="item"
            [ngClass]="getPriorityClass(item.priority)">
            <div class="card-priority-indicator"></div>
            <div class="card-content-jira">
              <div class="card-header-jira">
                <span class="card-title-jira" [routerLink]="['/goals', item.employeeGoalId]"
                  style="cursor: pointer;">{{ item.title }}</span>
              </div>
              <div class="card-footer-jira">
                <div class="card-type-key" [routerLink]="['/goals', item.employeeGoalId]" style="cursor: pointer;">
                  <mat-icon class="jira-type-icon" style="color: #4f46e5;">flag</mat-icon>
                  <span class="jira-key">GOL-{{ item.employeeGoalId }}</span>
                  <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px;">{{ item.progressPercentage }}%</span>
                </div>
                <div class="avatar-stack">
                  <div class="mini-avatar" *ngFor="let m of item.members.slice(0,3)"
                    [style.background]="getAssigneeColor(m.employeeId)"
                    [matTooltip]="m.employeeName">
                    {{ getAssigneeInitials(m.employeeId) }}
                  </div>
                  <div class="mini-avatar" *ngIf="item.members.length > 3" style="background: #e2e8f0; color: #475569;">
                    +{{ item.members.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deferred Column -->
      <div class="kanban-column col-hold">
        <div class="col-header">
          <div class="col-title">DEFERRED <span class="badge">{{ kanbanOnHold.length }}</span></div>
        </div>
        <div class="column-content" cdkDropList id="col-5" [cdkDropListData]="kanbanOnHold"
          (cdkDropListDropped)="drop($event, 5)">
          <div class="task-card" *ngFor="let item of kanbanOnHold" cdkDrag [cdkDragData]="item"
            [ngClass]="getPriorityClass(item.priority)">
            <div class="card-priority-indicator"></div>
            <div class="card-content-jira">
              <div class="card-header-jira">
                <span class="card-title-jira" [routerLink]="['/goals', item.employeeGoalId]"
                  style="cursor: pointer;">{{ item.title }}</span>
              </div>
              <div class="card-footer-jira">
                <div class="card-type-key" [routerLink]="['/goals', item.employeeGoalId]" style="cursor: pointer;">
                  <mat-icon class="jira-type-icon" style="color: #4f46e5;">flag</mat-icon>
                  <span class="jira-key">GOL-{{ item.employeeGoalId }}</span>
                  <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px;">{{ item.progressPercentage }}%</span>
                </div>
                <div class="avatar-stack">
                  <div class="mini-avatar" *ngFor="let m of item.members.slice(0,3)"
                    [style.background]="getAssigneeColor(m.employeeId)"
                    [matTooltip]="m.employeeName">
                    {{ getAssigneeInitials(m.employeeId) }}
                  </div>
                  <div class="mini-avatar" *ngIf="item.members.length > 3" style="background: #e2e8f0; color: #475569;">
                    +{{ item.members.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE VIEW -->`;

content = content.replace(regex, newKanban);
fs.writeFileSync(file, content);
