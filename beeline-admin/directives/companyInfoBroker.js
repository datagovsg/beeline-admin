import assert from 'assert';

export default function(companiesSvc) {
  return {
    scope: {
      companyId: '<',
      company: '=',
    },
    replace: true,
    link(scope, elem, attr) {
      scope.$watch('companyId', (tripId) => {
        if (!tripId) {
          scope.company = null;
          return;
        }
        else {
          companiesSvc.getCompanies().then((companies) => {
            scope.company = companies.find(c => c.id == scope.companyId)
          })
        }
      })
    }
  }
}
