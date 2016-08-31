
export default function($http, companiesSvc) {
  return {
    template: `
<select multiple
    ng-options="company.id as company.name for company in (companies | orderBy:'name')"
    class="form-control-condensed">
</select>
    `,
    scope: {
      autoSelect: '<'
    },
    replace: true,
    link(scope, elem, attr) {
      companiesSvc.getCompanies()
      .then((companies) => {
        if (scope.autoSelect && companies.length === 1) {
          scope.ngModel = companies[0].id
        }

        return scope.companies = companies
      })
    },
  }
}
