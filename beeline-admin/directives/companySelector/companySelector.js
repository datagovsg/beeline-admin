
export default function($http, companiesSvc) {
  return {
    template: `
<select
    ng-model="ngModel"
    ng-options="company.id as company.name for company in (companies | orderBy:company.name)"
    >
</select>
    `,
    scope: {
      ngModel: '=?',
    },
    link(scope, elem, attr) {
      companiesSvc.getCompanies()
      .then((companies) => {
        return scope.companies = [{id:0, name: '(All)'}].concat(companies)
      })
    },
  }
}
