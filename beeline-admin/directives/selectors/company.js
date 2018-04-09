
export default function($http, AdminService) {
  return {
    template: `
<select
    ng-options="company.id as company.name for company in (companies | orderBy:'name')"
    class="form-control-condensed"> <option value="">- Select a Company -</option>
</select>
    `,
    replace: true,
    link(scope, elem, attr) {
      AdminService.fetchAdminCompanies()
      .then((companies) => {
        return scope.companies = [{id:0, name: '(All)'}].concat(companies)
      })
    },
  }
}
