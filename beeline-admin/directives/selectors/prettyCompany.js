
export default function($http, companiesSvc, AdminService) {
  return {
    template: `
<div class="pretty-company" ng-if="!adminService.actingCompany">
  Select a company to proceed...<br/>
  <button ng-repeat="company in companies" ng-click="select(company)">
    <company-logo ng-if="company.id > 0" company-id="company.id"></company-logo>
  </button>
</div>
    `,
    replace: true,
    link(scope, elem, attr) {
      scope.adminService = AdminService;

      companiesSvc.getCompanies()
      .then((companies) => {
        return scope.companies = companies;
      })

      scope.select = (company) => {
        AdminService.actingCompany = company.id;
      }
    },
  }
}
