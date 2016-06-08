
export default function($http, AdminService) {
  return {
    template: `
<select

    ng-model="selectedCompany"
    ng-options="company.name for company in companies | orderBy:company.name track by company.id"
    >
</select>
    `,
    scope: {
      ngModel: '=',
    },
    link(scope, elem, attr) {
      scope.companies = [
        {id: 1},
        {id: 2},
        {id: 3},
        {id: 4},
        {id: 5},
        {id: 6},
        {id: 7},
      ];
      scope.selectedCompany = null;

      // Some bug in ngSelect??
      scope.$watch('selectedCompany', () => {
        if (scope.selectedCompany) {
          scope.ngModel = scope.selectedCompany.id;
        }
        else {
          scope.ngModel = null;
        }
      })
      scope.$watch('ngModel', () => {
        scope.selectedCompany = scope.companies.find(x => x.id == scope.ngModel)
      })

      AdminService.beeline({
        method: 'GET',
        url: '/companies',
      })
      .then((response) => {
        return scope.companies = response.data
      })
    },
  }
}
