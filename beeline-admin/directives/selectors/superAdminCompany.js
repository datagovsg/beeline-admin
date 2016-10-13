
export default function($http, AdminService, store, jwtHelper, $stateParams, $state) {
  return {
    replace: true,
    template: `
<select
  ng-options="company.id as company.name for company in (companies | orderBy:'name')"
  ng-model="selectedCompanyId"
  class="form-control-condensed">
  <option value="">(All)</option>
</select>
    `,
    link(scope, elem, attr) {
      // Get a list of companies you work for
      scope.companies = [];
      scope.adminService = AdminService;

      scope.$watch('selectedCompanyId', (newVal, oldVal) => {
        if (newVal === oldVal) return;
        if (newVal === AdminService.actingCompany) {
          $state.go(
            $state.current.name,
            _.defaults({companyId: newVal}, $stateParams),
            {notify: false, reload: false}
          )
        }
        else {
          $state.go(
            $state.current.name,
            _.defaults({companyId: newVal}, $stateParams)
          )
        }
      })

      // Read id from profile
      scope.$watch(() => store.get('sessionToken'), (token) => {
        if (!token) return;
        var decodedToken = jwtHelper.decodeToken(token);
        if (!decodedToken) return;

        if (decodedToken.app_metadata.roles.indexOf('superadmin') !== -1) {
          AdminService.beeline({
            url: `/companies`
          })
          .then((result) => {
            scope.companies = result.data;
          })
        }
        else {
          var adminId = decodedToken.app_metadata.adminId;

          AdminService.beeline({
            url: `/admins/${adminId}`
          })
          .then((result) => {
            scope.companies = result.data.transportCompanies;
            if (scope.companies.length === 1) {
              scope.selectedCompanyId = AdminService.actingCompany = scope.companies[0].id;
            }
          })
        }
      });
    },
  }
}
