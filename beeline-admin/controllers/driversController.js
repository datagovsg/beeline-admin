import querystring from 'querystring'

export default function ($scope, AdminService) {
  $scope.drivers = [];

  function query() {
    if (!AdminService.getCompanyId()) {
      return;
    }
    AdminService.beeline({
      method: 'GET',
      url: '/drivers?' + querystring.stringify({
        transportCompanyId: AdminService.getCompanyId(),
      }),
    })
    .then((response) => {
      $scope.drivers = response.data;
    })
  }

  $scope.deleteDriver = (did) => {
    console.log(did);
    AdminService.beeline({
      method: 'DELETE',
      url: `/drivers/${did}?` + querystring.stringify({
        transportCompanyId: AdminService.getCompanyId(),
      })
    })
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  };

  $scope.updateDriverName = (did) => {
    var newName = prompt('Name?');

    if (!newName) return;

    AdminService.beeline({
      method: 'PUT',
      url: `/drivers/${did}`,
      data: {
        name: newName,
        transportCompanyId: AdminService.getCompanyId(),
      }
    })
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  }

  $scope.addDriver = (did) => {
    var phoneNumber = prompt("Phone number?");

    if (!phoneNumber) return;

    var name = prompt("Name?");

    if (!name) return;

    AdminService.beeline({
      method: 'POST',
      url: `/drivers`,
      data: {
        telephone: phoneNumber,
        name: name,
        transportCompanyId: AdminService.getCompanyId()
      }
    })
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  };

  $scope.$watch(() => AdminService.actingCompany, query)
}
