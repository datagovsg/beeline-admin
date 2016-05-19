

export default function(AdminService) {
  return {
    replace: true,
    template: require('./adminNav.html'),
    link(scope, elem, attr) {
      scope.adminService = AdminService
    }
  }
}
