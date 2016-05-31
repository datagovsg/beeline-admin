

export default function(AdminService, auth) {
  return {
    replace: true,
    template: require('./adminNav.html'),
    link(scope, elem, attr) {
      scope.adminService = AdminService
      scope.auth = auth;
    }
  }
}
