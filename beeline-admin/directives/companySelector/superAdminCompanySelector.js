
export default function($http, AdminService) {
  return {
    replace: true,
    template: `
<company-selector
ng-if="adminService.session.role == 'superadmin'"
ng-model="adminService.actingCompany"></company-selector>
    `,
    link(scope, elem, attr) {
      scope.adminService = AdminService;
    },
  }
}
