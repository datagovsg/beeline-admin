
export default function($http, companiesSvc) {
  return {
    template: `<img ng-src="{{backend}}/companies/{{companyId}}/logo" />`,
    replace: true,
    scope: {
      companyId: '<',
    },
    link(scope, elem, attr) {
      scope.backend = process.env.BACKEND_URL;
    },
  }
}
