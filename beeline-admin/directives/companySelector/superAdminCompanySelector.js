
export default function($http, AdminService) {
  return {
    replace: true,
    template: `
<label ng-if="adminService.session().role == 'superadmin'">
  You are SuperAdmin! Choose the company you're acting on behalf of:
  <company-selector
  ng-model="adminService.actingCompany"></company-selector>
</label>
    `,
    link(scope, elem, attr) {
      scope.adminService = AdminService;
    },
  }
}
