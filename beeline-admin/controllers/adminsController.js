import querystring from 'querystring';
import _ from 'lodash';

export default function ($scope, AdminService, LoadingSpinner, commonModals) {
  function query() {
    if (!AdminService.getCompanyId()) return;

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'GET',
      url: `/companies/${AdminService.getCompanyId()}/admins`,
    })
    .then((response) => {
      $scope.admins = response.data;
      console.log($scope.admins)
      for (let admin of $scope.admins) {
        admin.permissions = reverseMapPermissions(admin.transportCompanies[0].adminCompany.permissions)
      }
    }))
  }

  $scope.deleteAdmin = async (admin) => {
    if (!AdminService.getCompanyId()) return;

    if (!await commonModals.confirm(`Are you sure you want to delete ${admin.email}?`))
      return;
    AdminService.beeline({
      method: 'DELETE',
      url: `/companies/${AdminService.getCompanyId()}/admins/${admin.id}`,
    })
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  };

  $scope.updateAdmin = (admin, form) => {
    if (!AdminService.getCompanyId()) return;

    if (admin.id) {
      AdminService.beeline({
        method: 'PUT',
        url: `/companies/${AdminService.getCompanyId()}/admins/${admin.id}`,
        data: {
          permissions: mapPermissions(admin.permissions),
        }
      })
      .then(query)
      .then(() => {
        form.$setPristine();
      })
      .then(null, err => {
        console.log(err);
      });
    }
    else {
      AdminService.beeline({
        method: 'POST',
        url: `/companies/${AdminService.getCompanyId()}/admins`,
        data: {
          name: admin.name,
          email: admin.email,
          permissions: mapPermissions(admin.permissions)
        }
      })
      .then(query)
      .then(() => {
        form.$setPristine();
      })
      .then(null, err => {
        console.log(err);
      });
    }

  }

  $scope.addAdmin = () => {
    $scope.admins.push({
      permissions: {}
    })
  };

  query();
}
