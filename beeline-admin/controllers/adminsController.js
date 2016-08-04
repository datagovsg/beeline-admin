import querystring from 'querystring';
import _ from 'lodash';

export default function ($scope, AdminService, LoadingSpinner, commonModals) {
  $scope.admins = [];

  function query() {
    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'GET',
      url: '/admins',
    })
    .then((response) => {
      $scope.admins = response.data;
    }))
  }

  $scope.deleteAdmin = async (admin) => {
    if (!await commonModals.confirm(`Are you sure you want to delete ${admin.email}?`))
      return;
    AdminService.beeline({
      method: 'DELETE',
      url: `/admins/${admin.id}`,
    })
    .then(query)
    .then(null, err => {
      console.log(err);
    });
  };

  $scope.updateAdmin = (admin, form) => {
    if (admin.id) {
      AdminService.beeline({
        method: 'PUT',
        url: `/admins/${admin.id}`,
        data: {
          name: admin.name,
          telephone: admin.telephone || null,
          receiveAlerts: admin.receiveAlerts ? 'true' : 'false',
          isCompanyAdmin: admin.isCompanyAdmin ? 'true' : 'false',
          transportCompanyId: admin.transportCompanyId
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
        url: `/admins`,
        data: {
          name: admin.name,
          email: admin.email,
          telephone: admin.telephone || null,
          receiveAlerts: admin.receiveAlerts ? 'true' : 'false',
          isCompanyAdmin: admin.isCompanyAdmin ? 'true' : 'false',
          transportCompanyId: admin.transportCompanyId,
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
    $scope.admins.push({})
  };

  query();
}
