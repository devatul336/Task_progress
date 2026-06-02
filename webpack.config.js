const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'progressTrackerMfe',
  exposes: {
    './Component': './src/app/app.component.ts',
    './EmployeeDashboard': './src/app/dashboard/employee-dashboard/employee-dashboard.component.ts',
    './ManagerDashboard': './src/app/dashboard/manager-dashboard/manager-dashboard.component.ts',
    './OrgDashboard': './src/app/dashboard/org-dashboard/org-dashboard.component.ts',
    './TaskBoard': './src/app/tasks/task-board/task-board.component.ts',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: false }),
  },
});
