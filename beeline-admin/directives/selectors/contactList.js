
angular.module('beeline-admin')
.directive('contactListSelector', function($http, companiesSvc, AdminService, $rootScope) {

  let contactLists = []

  $rootScope.$watch(() => AdminService.getCompanyId(), (companyId) => {
    if (companyId) {
      AdminService.beeline({
        method: 'GET',
        url: `/companies/${companyId}/contactLists`
      })
      .then((response) => {
        contactLists = response.data
      })
      .catch((err) => {
        contactLists = [{id: 0, description: 'Error loading list'}]
      })
    }
  })

  return {
    template: `
<select
    ng-options="contactList.id as contactList.description for contactList in (contactLists() | orderBy:'name')"
    class="form-control-condensed"> <option value="">- Select a Contact List -</option>
</select>
    `,
    replace: true,
    controller($scope) {
      $scope.contactLists = () => contactLists
    },
  }
})
