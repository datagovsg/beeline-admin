
export default function($http, companiesSvc) {
  return {
    template: `
<select
    ng-options="company.id as company.name for company in (companies | orderBy:'name')"
    class="form-control-condensed"> <option value="">- Select a Company -</option>
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

        return scope.companies = [{id:0, name: '(All)'}].concat(companies)
      })
    },
  }
}
