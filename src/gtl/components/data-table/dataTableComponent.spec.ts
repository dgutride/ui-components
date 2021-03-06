// import DataTable from './dataTableComponent';

describe('DataTable test', () =>  {
  let bindings;

  let columns = [{is_narrow: true}, {is_narrow: true}, {text: 'Name', col_idx: 0}, {text: 'First value', col_idx: 1}];
  let rows = [
    {
      id: 2,
      cells: [
        {is_checkbox: true}, {image: 'some_url.jpg', icon: 'fa fa-icon'}, {text: 'first name'}, {text: 'value'}
      ]
    },
    {
      id: 3,
      cells: [
        {is_checkbox: true}, {image: 'some_url.jpg', icon: 'fa fa-icon'}, {text: 'second name'}, {text: 'value 2'}
      ]
    }
  ];
  let perPage = {
    label: 'Items per page',
    enabled: true,
    hidden: false,
    text: 5,
    value: 5,
    items: [{text: 5, value: 5, hidden: false, enabled: true}]
  };
  let settings = {perpage: 5, current: 1, items: 2, total: 1, sortBy: {sortObject: {col_idx: 0}, isAscending: true}};

  const onItemSelected = jasmine.createSpy('onItemSelected', (item: any, isSelected: boolean) => {}),
        onRowClick = jasmine.createSpy('onRowClick', (item: any) => {}),
        onSort = jasmine.createSpy('onSort', (headerId: any, isAscending: boolean) => {}),
        loadMoreItems = jasmine.createSpy('loadMoreItems', (start: number, perPage: number) => {});

  describe('controller', () => {
    let dataTableCtrl;

    beforeEach(() => {
      bindings = {
        rows: rows,
        columns: columns,
        perPage: perPage,
        settings: settings,
        loadMoreItems: loadMoreItems,
        onSort: onSort,
        onRowClick: onRowClick,
        onItemSelected: onItemSelected
      };
      angular.mock.module('miqStaticAssets.gtl');
      angular.mock.inject($componentController => {
        dataTableCtrl = $componentController('miqDataTable', null, bindings);
      });
    });

    it('should check all', () => {
      dataTableCtrl.onCheckAll(true);
      expect(dataTableCtrl.onItemSelected).toHaveBeenCalledTimes(rows.length);
    });

    it('should call sort function', () => {
      dataTableCtrl.onSortClick(2, true);
      expect(dataTableCtrl.onSort).toHaveBeenCalledWith({headerId: 2, isAscending: true});
    });

    it('should call loading more items after per page click', () => {
      dataTableCtrl.perPageClick(perPage.items[0]);
      expect(dataTableCtrl.loadMoreItems).toHaveBeenCalledWith({start: 0, perPage: perPage.items[0].value});
    });

    it('should load more items after setting page', () => {
      dataTableCtrl.setPage(1);
      expect(dataTableCtrl.loadMoreItems).toHaveBeenCalledWith({start: 0, perPage: perPage.items[0].value});
    });

    it('should set first page even with higher page number', () => {
      dataTableCtrl.setPage(2);
      expect(dataTableCtrl.loadMoreItems).toHaveBeenCalledWith({start: 0, perPage: perPage.items[0].value});
    });

    it('should get correct column class', () => {
      expect(
        angular.equals(dataTableCtrl.getColumnClass(columns[0]), {narrow: true})
      );
      expect(
        angular.equals(dataTableCtrl.getColumnClass(columns[2]), {narrow: false})
      );
    });

    it('should check if column is icon or image', () => {
      expect(dataTableCtrl.isIconOrImage(rows[0], 1)).toBeTruthy();
      expect(dataTableCtrl.isIconOrImage(rows[0], 2)).toBeFalsy();
    });

    it('should check if filtered by column', () => {
      expect(dataTableCtrl.isFilteredBy(columns[2])).toBeTruthy();
      expect(dataTableCtrl.isFilteredBy(columns[3])).toBeFalsy();
    });

    it('should get correct sort class', () => {
      expect(
        angular.equals(
          dataTableCtrl.getSortClass(),
          {'fa-sort-asc': true, 'fa-sort-desc': false}
        )
      );
      settings.sortBy.isAscending = false;
      expect(
        angular.equals(
          dataTableCtrl.getSortClass(),
          {'fa-sort-asc': false, 'fa-sort-desc': true}
        )
      );
    });

    it('should validate page number if wrong number is inserted', () => {
      dataTableCtrl.setTablePage('-1');
      expect(dataTableCtrl.settings.current).toBe(1);
      dataTableCtrl.setTablePage('d');
      expect(dataTableCtrl.settings.current).toBe(1);
    });
  });

  describe('component', () => {
    let scope, compile, compiledElement;
    beforeEach(() => {
      angular.mock.module('miqStaticAssets.gtl');
      angular.mock.module('miqStaticAssets.toolbar');
      angular.mock.inject(($rootScope, $compile: ng.ICompileService) => {
        scope = $rootScope.$new();
        compile = $compile;
      });

      scope.rows = rows;
      scope.perPage = perPage;
      scope.columns = columns;
      scope.settings = settings;
      scope.loadMoreItems = loadMoreItems;
      scope.onSort = onSort;
      scope.onRowClick = onRowClick;
      scope.onItemSelected = onItemSelected;

      compiledElement = compile(
        angular.element(
          `<miq-data-table rows="rows"
                           columns="columns"
                           per-page="perPage"
                           settings="settings"
                           load-more-items="onLoadMoreItems(start, perPage)"
                           on-sort="onSort(headerId, isAscending)"
                           on-row-click="onRowClick(item)"
                           on-item-selected="onItemSelect(item, isSelected)"></miq-data-table>`
        ))(scope);
      scope.$digest();
    });

    it('creates data table header with dropdown as per page selector', () => {
      let header = compiledElement[0].querySelector('.miq-data-tables-header');
      expect(header).toBeDefined();
      expect(header.querySelectorAll('miq-toolbar-list li').length).toBe(1);
    });

    it('creates table footer with paging', () => {
      let footer = compiledElement[0].querySelector('.dataTables_footer');
      expect(footer.querySelectorAll('.pagination').length).toBe(2);
      expect(footer.querySelectorAll('.pagination-input').length).toBeDefined();
      expect(footer.querySelectorAll('.pagination li').length).toBe(4);
      expect(footer.querySelector('.pagination .first').classList[1]).toBe('disabled');
      expect(footer.querySelector('.pagination .prev').classList[1]).toBe('disabled');
      expect(footer.querySelector('.pagination .next').classList[1]).toBe('disabled');
      expect(footer.querySelector('.pagination .last').classList[1]).toBe('disabled');
    });

    it('creates table head', () => {
      let header = compiledElement[0].querySelector('.mig-table-with-footer thead');
      expect(header).toBeDefined();
      expect(header.querySelectorAll('th').length).toBe(columns.length);
      let filteredByIndex = columns.map((column: any) => column.col_idx).indexOf(settings.sortBy.sortObject.col_idx);
      expect(header.querySelectorAll('th')[filteredByIndex].innerHTML).toContain('Name');
      expect(header.querySelectorAll('th i.fa')).toBeDefined();
    });

    it('creates tbody', () => {
      let body = compiledElement[0].querySelector('.mig-table-with-footer tbody');
      expect(body.querySelectorAll('tr').length).toBe(rows.length);
      let firstRowTds = body.querySelectorAll('tr')[0].querySelectorAll('td');
      expect(firstRowTds.length).toBe(rows[0].cells.length);
      expect(firstRowTds[0].querySelector('input')).toBeDefined();
      expect(firstRowTds[0].querySelector('i.fa')).toBeDefined();
      expect(firstRowTds[2].innerHTML).toContain(rows[0].cells[2]['text']);
      expect(firstRowTds[3].innerHTML).toContain(rows[0].cells[3]['text']);
    });
  });
});
