
angular.module('beeline-admin')
.directive('telephoneListSelector', function($http, companiesSvc, AdminService, $rootScope) {

  let telephoneLists = []

  $rootScope.$watch(() => AdminService.getCompanyId(), (companyId) => {
    if (companyId) {
      AdminService.beeline({
        method: 'GET',
        url: `/companies/${companyId}/telephoneLists`
      })
      .then((response) => {
        telephoneLists = response.data
      })
      .catch((err) => {
        telephoneLists = [{id: 0, description: 'Error loading list'}]
      })
    }
  })

  return {
    template: `
<select
    ng-options="telephoneList.id as telephoneList.description for telephoneList in (telephoneLists() | orderBy:'name')"
    class="form-control-condensed"> <option value="">- Select a Company -</option>
</select>
    `,
    replace: true,
    controller($scope) {
      $scope.telephoneLists = () => telephoneLists
    },
  }
})
