import querystring from 'querystring';
import _ from 'lodash';

export default function ($scope, AdminService, LoadingSpinner, commonModals) {
  const PermissionsMap = {
    basic: ['view-drivers', 'view-admins', 'view-transactions', 'monitor-operations'],
    refund: ['refund'],
    operations: ['manage-routes', 'manage-drivers', 'drive', 'update-trip-status', 'message-passengers', 'view-passengers', 'manage-notifications'],
    manageCompany: ['manage-company'],
    manageAdmins: ['manage-admins'],
  }
  $scope.admins = [];

  function mapPermissions(permissions) {
    return _(permissions)
      .keys()
      .filter(key => permissions[key])
      .map(value => PermissionsMap[value])
      .flatten()
      .value()
  }
  function reverseMapPermissions(permissionList) {
    var permissions = {};

    if (!permissionList)  return permissions;

    _.each(PermissionsMap, (permissionGroup, groupName) => {
      if (_.every(permissionGroup, p => permissionList.indexOf(p) !== -1)) {
        permissions[groupName] = true;
      }
      else {
        permissions[groupName] = false;
      }
    });
    return permissions;
  }

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
