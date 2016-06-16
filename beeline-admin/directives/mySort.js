
export default function() {
  return {
    scope: {
      sortModel: '=?',
      sortDirection: '=?',
    },
    link(scope, elem, attr) {
      if (attr.mySort) {
        elem[0].addEventListener('click', (event) => {
          scope.$apply(() => {
            if (scope.sortModel === attr.mySort) {
              scope.sortDirection = scope.sortDirection === 'asc' ? 'desc' : 'asc';
            }
            scope.sortDirection = scope.sortDirection || 'asc';
            scope.sortModel = attr.mySort;
          })
        })
        elem[0].classList.add('sortable')
      }

      scope.$watchGroup(['sortModel', 'sortDirection'], ([model, direction]) => {
        if (model == attr.mySort) {
          elem[0].classList.remove('sort-asc');
          elem[0].classList.remove('sort-desc');

          if (direction == 'asc') {
            elem[0].classList.add('sort-asc');
          } else if (direction == 'desc') {
            elem[0].classList.add('sort-desc');
          }
        }
      });
    }
  }
}
