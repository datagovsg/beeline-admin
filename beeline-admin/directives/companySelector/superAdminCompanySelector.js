
export default function($http, AdminService) {
  return {
    replace: true,
    template: `

<label ng-if="adminService.session().role == 'superadmin'">
  Super Admin
  <company-selector
  ng-model="adminService.actingCompany"></company-selector>
</label>
    `,
    link(scope, elem, attr) {
      scope.adminService = AdminService;
    },
  }
}
