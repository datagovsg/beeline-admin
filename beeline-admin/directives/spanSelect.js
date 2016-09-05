
/*
  Extends the multiple-date-picker to support span select.
*/
export default function (AdminService) {
  return {
    scope: {
      firstDate: '=?',
      lastDate: '=?',
      ngModel: '=?',
      highlightDays: '=?',
      // optional variables
      daysAllowed: '=?',
    },
    template: `<multiple-date-picker
      highlight-days="combinedHD"
      ng-model="ngModel"
      days-allowed="daysAllowed">
    </multiple-date-picker>`,
    link(scope, elem, attr) {
      scope.publicHolidays = [];
      var promise = AdminService.beeline({
        method: 'GET',
        url: `/publicHolidays`
      })
      .then((response) => {
        var rs = response.data;
        for (var index in rs) {
          var ph = {date: rs[index].date, css: 'holiday', title: rs[index].summary, isMatched: false};
          scope.publicHolidays.push(ph);
        }
      });

      scope.$watchGroup(['highlightDays','publicHolidays'],(hds, phs)=>{
        //deep copy of scope.publicHolidays into publicHolidays
        var publicHolidays = _.cloneDeep(phs);
        for (var ph in publicHolidays){
          for (var hd in hds){
            if (!publicHolidays[ph].isMatched) break;
            else if (moment(publicHolidays[ph].date).isSame(hds[hd].date,'day')){
              hds[hd].css += 'holiday';
              publicHolidays[ph].isMatched = true;
              break;
            }
          }
        }
        // scope.daysAllowed = [ Mon, Fri ]
        // Tue Wed Thu are NOT allowed, Mon Fri are allowed

        // scope.daysAllowed = null
        // Mon - Fri are all allowed
        for (var ph in publicHolidays) {
          if (!publicHolidays[ph].isMatched) {
            var isAllowed = true;
            if (scope.daysAllowed) {
              isAllowed = scope.daysAllowed.index(publicHolidays[ph])==-1 ? false : true;
            }
            var hd = {date: publicHolidays[[ph].date], css: 'holiday', selectable: isAllowed, title: publicHolidays[[ph].summary]};
            scope.highlightDays.push(hd);
          }
        }
      });
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
