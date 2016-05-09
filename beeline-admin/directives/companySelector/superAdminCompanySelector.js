
export default function($http, AdminService) {
  return {
    replace: true,
    template: `
<label>
  You are SuperAdmin! Choose the company you're acting on behalf of:
  <company-selector
  ng-if="adminService.session.role == 'superadmin'"
  ng-model="adminService.actingCompany"></company-selector>
</label>
    `,
    link(scope, elem, attr) {
      scope.adminService = AdminService;
    },
  }
}
