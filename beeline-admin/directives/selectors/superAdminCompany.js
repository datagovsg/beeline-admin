import {sortBy} from 'lodash'

export default function($http, AdminService, store, jwtHelper, $stateParams, $state) {
  return {
    replace: true,
    template: `
<select
  ng-options="company.id as company.name for company in (availableCompanies)"
  ng-model="selectedCompanyId"
  ng-change="updateCompany()"
  class="form-control-condensed">
  <option value="">(All)</option>
</select>
    `,
    controller($scope) {
      // Get a list of companies you work for
      $scope.availableCompanies = [];
      $scope.adminService = AdminService;
      $scope.selectedCompanyId = AdminService.actingCompany;

      $scope.updateCompany = function () {
        $state.go(
          $state.current.name,
          _.defaults({companyId: $scope.selectedCompanyId}, $stateParams)
        )
      }

      $scope.$watch('adminService.actingCompany', (newVal) => {
        $scope.selectedCompanyId = newVal
      })

      // Read id from profile
      $scope.$watch(() => AdminService.session, (session) => {
        if (!session) return
        console.log(session)
        $scope.availableCompanies = session.transportCompanies.map(({name, id}) => ({name, id}))
      });
    },
  }
}
