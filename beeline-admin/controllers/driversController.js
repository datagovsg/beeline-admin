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
    var newName = prompt('Please enter the name of the Driver.');

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
    var phoneNumber = prompt("Please enter the 8-digit Mobile No. starting with the digit 8 or 9.");

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
