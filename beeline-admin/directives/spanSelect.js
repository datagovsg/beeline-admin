import _ from 'lodash';

/*
  Extends the multiple-date-picker to support span select.
*/

export default function () {
  return {
    scope: {
      firstDate: '=?',
      lastDate: '=?',
      monthChanged: '=?',
      ngModel: '=?',
      highlightDays: '=?',
      combinedHL: '<',
    },
    template: `<multiple-date-picker ph-date-picker
      ng-model="ngModel"
      month-changed="monthChanged"
      highlight-days="combinedHL">
    </multiple-date-picker>`,
    link(scope, elem, attr) {
      let firstPick;
      let ignoreChange = true;
      scope.$watch('ngModel', (newValue, oldValue) => {
        if (ignoreChange) {
          ignoreChange = false;
          return;
        }
        let _oldValue = oldValue || [];
        let _newValue = newValue || [];
        const difference = _.xorBy(_oldValue, _newValue, m => m.valueOf());
        if (difference.length > 0) {
          if (firstPick) {
            let secondPick = difference[0];
            scope.firstDate =  new Date(Math.min(firstPick, secondPick));
            scope.lastDate = new Date(Math.max(firstPick, secondPick));
            firstPick = null;
            if (_newValue.length === 0) {
              ignoreChange = true;
              scope.ngModel = [secondPick];
            }
          } else {
            firstPick = difference[0];
            if (_newValue.length !== 1 || _newValue[0].valueOf() !== firstPick.valueOf()) {
              ignoreChange = true;
              scope.ngModel = [firstPick];
            }
          }
        }
      }, true);
      scope.$watchGroup(['publicHolidays','highlightDays'],([ph, hl])=>{
        if (ph && hl) {
          let phByDate = _.keyBy(ph, 'date');
          let hlByDate = _.keyBy(hl, 'date');
          let is = _.intersection(_.keys(phByDate), _.keys(hlByDate));
          if (is && is.length > 0) {
            for (let i of is) {
              //combine 2 entries and reomve the one in highlightDays
              _.extend(phByDate[i],hlByDate[i]);
              hlByDate = _.omit(hlByDate,[i]);
            }
          }
          scope.combinedHL = _.concat(_.values(phByDate), _.values(hlByDate));
        }
      })
    }
  }
}
