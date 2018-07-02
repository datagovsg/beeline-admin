
/**
  * openModal(options)
  *
  * @returns Promise[result]
  *
  * From $uibModal documentation: "the scope associated with modal's content
  * is augmented with `$close(result)` ... and `$dismiss(reason)`"
  *
  * Options:
  * @property scope {Object} Scope data
  * @property template {String}
  * @property controller {String | Function}
  *
  * All options passed to $uibModal. The only difference between uibModal and
  * this is that this automatically cleans up  the scope.
  *
  **/
angular.module('beeline-admin')
.service('uibModalPromise', ['$uibModal', '$rootScope', function ($uibModal, $rootScope) {

  this.openModal = function (options) {
    // format contextual data
    var modalScope = $rootScope.$new();

    _.assign(modalScope, {data: options.data})

    var modal = $uibModal.open({
      ...options,
      scope: modalScope,
    });

    modal.result.then(() => modalScope.$destroy()).catch(() => modalScope.$destroy())

    return modal.result
  }
}])
