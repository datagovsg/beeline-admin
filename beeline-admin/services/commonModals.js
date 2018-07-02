const alertModalTemplate = require('../templates/modals/alert.html');
const confirmModalTemplate = require('../templates/modals/confirm.html');
const promptModalTemplate = require('../templates/modals/prompt.html');
import _ from 'lodash';

export default ['$rootScope', '$uibModal', function ($rootScope, $uibModal) {

  this.alert = function (options) {
    var modalScope = $rootScope.$new();

    if (typeof options === 'string') {
      _.assign(modalScope, {
        title: 'Alert',
        message: options
      })
    }
    else {
      _.assign(modalScope, _.pick(options, ['title', 'message']))
    }

    var dialog = $uibModal.open({
      template: alertModalTemplate,
      scope: modalScope,
      keyboard: false,
      backdrop: 'static'
    });

    dialog.result.then(() => {
      modalScope.$destroy();
    }, (err) => {
      modalScope.$destroy();
      throw err;
    })

    return dialog.result;
  }

  this.flash = function (options) {
    var modalScope = $rootScope.$new();

    if (typeof options === 'string') {
      _.assign(modalScope, {
        title: 'Alert',
        message: options
      })
    }
    else {
      _.assign(modalScope, _.pick(options, ['title', 'message']))
    }

    var dialog = $uibModal.open({
      template: alertModalTemplate,
      scope: modalScope,
      keyboard: false,
      backdrop: 'static'
    });

    setTimeout(() => dialog.close(), (options && options.duration) || 1000);

    dialog.result.then(() => {
      modalScope.$destroy();
    }, (err) => {
      modalScope.$destroy();
      throw err;
    })

    return dialog.result;
  }

  this.confirm = function (options) {
    var modalScope = $rootScope.$new();

    if (typeof options === 'string') {
      _.assign(modalScope, {
        title: 'Confirm',
        message: options,
      })
    }
    else {
      _.assign(modalScope, _.pick(options, ['title', 'message']))
    }

    var dialog = $uibModal.open({
      template: confirmModalTemplate,
      scope: modalScope,
      keyboard: false,
      backdrop: 'static'
    })

    dialog.result.then(() => {
      modalScope.$destroy();
    }, (err) => {
      modalScope.$destroy();
      throw err;
    })

    return dialog.result;
  }

  this.prompt = function (options) {
    var modalScope = $rootScope.$new();

    if (typeof options === 'string') {
      _.assign(modalScope, {
        title: 'Prompt',
        message: options,
      })
    }
    else {
      _.assign(modalScope, _.pick(options, ['title', 'message']))
      modalScope.input = options.default;
    }

    var dialog = $uibModal.open({
      template: promptModalTemplate,
      scope: modalScope,
      keyboard: false,
      backdrop: 'static'
    })

    dialog.result.then(() => {
      modalScope.$destroy();
    }, (err) => {
      modalScope.$destroy();
      throw err;
    })

    return dialog.result;
  }
}]
