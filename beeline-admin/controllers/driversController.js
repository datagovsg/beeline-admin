import querystring from 'querystring'

export default function ($scope, AdminService, LoadingSpinner) {
  $scope.drivers = [];

  function query() {
    if (!AdminService.getCompanyId()) {
      return;
    }

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'GET',
      url: `/companies/${AdminService.getCompanyId()}/drivers`,
    }))
    .then((response) => {
      $scope.drivers = response.data;
    })
  }

  $scope.deleteDriver = (did) => {
    console.log(did);
    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'DELETE',
      url: `/companies/${AdminService.getCompanyId()}/drivers/${did}?`
    }))
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  };

  $scope.updateDriverName = (did) => {
    var newName = prompt('Please enter the name of the Driver.');

    if (!newName) return;

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'PUT',
      url: `/companies/${AdminService.getCompanyId()}/drivers/${did}`,
      data: {
        name: newName
      }
    }))
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

    var remarks = prompt("Remarks?");

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'POST',
      url: `/companies/${AdminService.getCompanyId()}/drivers`,
      data: {
        telephone: phoneNumber,
        name: name,
        remarks: remarks
      }
    }))
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  };

  $scope.$watch(() => AdminService.getCompanyId(), query)
}
