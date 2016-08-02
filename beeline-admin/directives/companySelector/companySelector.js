
export default function($http, companiesSvc) {
  return {
    template: `
<select
    ng-options="company.id as company.name for company in (companies | orderBy:'name')"
    > <option value="">- Select a Company -</option>
</select>
    `,
    replace: true,
    link(scope, elem, attr) {
      companiesSvc.getCompanies()
      .then((companies) => {
        return scope.companies = [{id:0, name: '(All)'}].concat(companies)
      })
    },
  }
}
