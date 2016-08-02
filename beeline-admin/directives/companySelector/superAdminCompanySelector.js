
export default function($http, AdminService) {
  return {
    replace: true,
    template: `
<span ng-if="adminService.session().role == 'superadmin'">
<label class="superAdmin">Logged in as Super Admin
</label>
<company-selector
ng-model="adminService.actingCompany"></company-selector>
</span>
    `,
    link(scope, elem, attr) {
      scope.adminService = AdminService;
    },
  }
}
