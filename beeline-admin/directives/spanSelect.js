
/*
  Extends the multiple-date-picker to support span select.
*/
var offset = new Date().getTimezoneOffset() * 60000;
export default function (AdminService) {
  return {
    scope: {
      firstDate: '=?',
      lastDate: '=?',
      ngModel: '=?',
      highlightDays: '=?',
    },
    template: `<multiple-date-picker
      highlight-days="combineHD"
      ng-model="ngModel">
    </multiple-date-picker>`,
    link(scope, elem, attr) {
      scope.phs = [];
      var promise = AdminService.beeline({
        method: 'GET',
        url: `/publicHolidays`
      })
      .then((response) => {
        var rs = response.data;
        for (var index in rs) {
          var ph = {date: rs[index].date, css: 'holiday', selectable: true, title: rs[index].summary};
          scope.phs.push(ph);
        }
      });

      scope.$watch('highlightDays',(hds)=>{
        var phs = scope.phs;
        for (var ph in phs){
          for (var hd in hds){
            if (moment(phs[ph].date).isSame(hds[hd].date,'day')){
              _.assign(phs[ph], hds[hd]);
              hds.splice(hd,1);
              break;
            }
          }
        }
        scope.combineHD = _.concat(phs, hds);
      },true);
      scope.$watch('ngModel', (newValue, oldValue) => {
        console.log(newValue);

        if (!newValue || newValue.length === 0) {
          if (scope.firstDate && scope.lastDate) {
            scope.ngModel = [
              moment(scope.firstDate), moment(scope.lastDate)
            ];
          }
        }
        else {
          if (newValue.length === 1) {
            return;
          }
          else if (newValue.length === 2) {
            scope.firstDate =  new Date(Math.min(newValue[0], newValue[1]))
            scope.lastDate = new Date(Math.max(newValue[0], newValue[1]))
          }
          else {
            scope.ngModel = [newValue[newValue.length-1]]
          }
        }
      }, true)
    }
  }
}
