
export default function ($scope, auth) {
  $scope.auth = auth;
  $scope.signin = function() {
    auth.signin({
      authParams: {
        scope: 'openid name email app_metadata user_id'
      }
    })
  }
  $scope.signup = function() {
    auth.signup({
      authParams: {
        scope: 'openid name email app_metadata user_id'
      }
    })
  }
}
