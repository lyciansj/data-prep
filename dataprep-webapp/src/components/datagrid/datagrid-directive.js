(function () {
    'use strict';

    function Datagrid($timeout, $compile, $window, DatasetGridService, FilterService) {
        return {
            restrict: 'E',
            templateUrl: 'components/datagrid/datagrid.html',
            bindToController: true,
            controllerAs: 'datagridCtrl',
            controller: 'DatagridCtrl',
            link: function (scope, iElement, iAttrs, ctrl) {
                var options, grid, colHeaderElements = [];

                //------------------------------------------------------------------------------------------------------
                //------------------------------------------------COL UTILES--------------------------------------------
                //------------------------------------------------------------------------------------------------------

                /**
                 * Reset columns class
                 */
                var resetColumnsClass = function() {
                    _.forEach(grid.getColumns(), function(column) {
                        column.cssClass = null;
                    });
                };

                /**
                 * Reset the cells css
                 */
                var resetCellStyles = function() {
                    grid.setCellCssStyles('highlight', {});
                };

                /**
                 * Adapt backend column to slick column. The name with div id depending on index is important. It is used to insert column header dropdown and quality bar
                 * @param col - the backend column to adapt
                 * @param index - column index
                 * @returns {{id: *, field: *, name: string}}
                 */
                var columnItem = function (col, index) {
                    var divId = 'datagrid-header-' + index;
                    var colItem = {
                        id: col.id,
                        field: col.id,
                        name: '<div id="' + divId + '"></div>'
                    };

                    return colItem;
                };

                /**
                 * Insert the dataset headers (dropdown actions and quality bars)
                 */
                var insertDatasetHeaders = function () {
                    _.forEach(DatasetGridService.data.columns, function (col, index) {
                        var headerScope = scope.$new(true);
                        headerScope.columns = col;
                        headerScope.metadata = DatasetGridService.metadata;
                        var headerElement = angular.element('<datagrid-header column="columns" metadata="metadata"></datagrid-header>');
                        $compile(headerElement)(headerScope);

                        colHeaderElements.push(headerElement);
                        angular.element('#datagrid-header-' + index).append(headerElement);
                    });
                };

                /**
                 * Remove header elements
                 */
                var clearHeaders = function () {
                    _.forEach(colHeaderElements, function (element) {
                        element.remove();
                    });
                    colHeaderElements = [];
                };

                var updateColSelection = function (column) {
                    $timeout(function() {
                        DatasetGridService.setSelectedColumn(column.id);
                    });
                };

                //------------------------------------------------------------------------------------------------------
                //-------------------------------------------------LISTENERS--------------------------------------------
                //------------------------------------------------------------------------------------------------------
                /**
                 * Attach listeners for big table row management
                 */
                var attachLongTableListeners = function() {
                    DatasetGridService.dataView.onRowCountChanged.subscribe(function () {
                        grid.updateRowCount();
                        grid.render();
                    });
                    DatasetGridService.dataView.onRowsChanged.subscribe(function (e, args) {
                        grid.invalidateRows(args.rows);
                        grid.render();
                    });
                };

                /**
                 * Attach listeners for custom directives management in headers
                 */
                var attachColumnHeaderListeners = function() {
                    //destroy old elements and insert compiled column header directives
                    grid.onColumnsReordered.subscribe(function () {
                        clearHeaders();
                        insertDatasetHeaders();
                    });

                    //change column background and update column profil on click
                    grid.onHeaderClick.subscribe(function(e, args) {
                        var columnId = args.column.id;
                        var column = _.find(grid.getColumns(), function(column) {
                            return column.id === columnId;
                        });

                        if(column.cssClass !== 'selected') {
                            resetCellStyles();
                            resetColumnsClass();
                            column.cssClass = 'selected';
                            grid.invalidate();

                            updateColSelection(column);
                        }
                    });
                };

                /**
                 * Attach cell hover for tooltips listeners
                 */
                var attachTooltipListener = function() {
                    //show tooltip on hover
                    grid.onMouseEnter.subscribe(function(e) {
                        var cell = grid.getCellFromEvent(e);
                        var row = cell.row;
                        var column = grid.getColumns()[cell.cell];

                        var item = DatasetGridService.dataView.getItem(row);
                        var position = {
                            x: e.clientX,
                            y: e.clientY
                        };

                        ctrl.updateTooltip(item, column.id, position);
                    });
                    //hide tooltip on leave
                    grid.onMouseLeave.subscribe(function() {
                        ctrl.hideTooltip();
                    });
                };

                /**
                 * Attach cell action listeners (click, active change, ...)
                 */
                var attachCellListeners = function() {
                    //get clicked content and highlight cells in clicked column containing the content
                    grid.onClick.subscribe(function (e,args) {
                        var config = {};
                        var column = grid.getColumns()[args.cell];
                        var content = DatasetGridService.dataView.getItem(args.row)[column.id];

                        var rowsContainingWord = DatasetGridService.getRowsContaining(column.id, content);
                        _.forEach(rowsContainingWord, function(rowId) {
                            config[rowId] = {};
                            config[rowId][column.id] = 'highlight';
                        });

                        grid.setCellCssStyles('highlight', config);
                        grid.invalidate();

                        updateColSelection(column);
                    });

                    //change selected cell column background
                    grid.onActiveCellChanged.subscribe(function(e,args) {
                        if(angular.isDefined(args.cell)) {
                            var column = grid.getColumns()[args.cell];

                            if(column.cssClass !== 'selected') {
                                resetColumnsClass();
                                column.cssClass = 'selected';
                                grid.invalidate();
                            }

                        }
                    });

                    $window.addEventListener('resize', function(){
                        grid.resizeCanvas();
                    }, true);
                };

                //------------------------------------------------------------------------------------------------------
                //---------------------------------------------------INIT-----------------------------------------------
                //------------------------------------------------------------------------------------------------------
                /**
                 * Init Slick grid and attach listeners on dataview and grid
                 */
                var initGridIfNeeded = function () {
                    if(grid) {
                        return;
                    }

                    options = {
                        editable: false,
                        enableAddRow: false,
                        enableCellNavigation: true,
                        enableTextSelectionOnCells: true
                    };
                    grid = new Slick.Grid('#datagrid', DatasetGridService.dataView, [], options);

                    //listeners
                    attachLongTableListeners();
                    attachColumnHeaderListeners();
                    attachCellListeners();
                    attachTooltipListener();
                };

                //------------------------------------------------------------------------------------------------------
                //--------------------------------------------------UPDATE----------------------------------------------
                //------------------------------------------------------------------------------------------------------
                /**
                 * Clear and update columns
                 * @param dataCols
                 */
                var updateColumns = function (dataCols) {
                    clearHeaders();

                    var columns = _.map(dataCols, function (col, index) {
                        return columnItem(col, index);
                    });
                    grid.setColumns(columns);

                    insertDatasetHeaders();
                };

                /**
                 * Render grid on dataView update
                 */
                var updateData = function () {
                    resetCellStyles();
                    grid.resetActiveCell();
                    grid.invalidate();
                };

                //------------------------------------------------------------------------------------------------------
                //-------------------------------------------------WATCHERS---------------------------------------------
                //------------------------------------------------------------------------------------------------------
                /**
                 * Update grid columns on backend column change
                 */
                scope.$watch(
                    function () {
                        return DatasetGridService.data ? DatasetGridService.data.columns : null;
                    },
                    function (cols) {
                        if (cols) {
                            initGridIfNeeded();
                            updateColumns(cols);
                            grid.autosizeColumns();
                        }
                    }
                );

                /**
                 * Update data on backend value change
                 */
                scope.$watch(
                    function () {
                        return DatasetGridService.data ? DatasetGridService.data.records : null;
                    },
                    function (records) {
                        if(records) {
                            initGridIfNeeded();
                            updateData();
                        }
                    }
                );

                /**
                 * Scroll to top when loaded dataset change
                 */
                scope.$watch(
                    function () {
                        return DatasetGridService.metadata;
                    },
                    function (metadata) {
                        if(metadata) {
                            grid.scrollRowToTop(0);
                        }
                    }
                );

                /**
                 * When filter change, displayed values change, so we reset active cell and cell styles
                 */
                scope.$watchCollection(
                    function () {
                        return FilterService.filters;
                    },
                    function () {
                        if(grid) {
                            resetCellStyles();
                            grid.resetActiveCell();
                            grid.scrollRowToTop(0);
                        }
                    }
                );

                /**
                 * Destroy scope on element destroy
                 */
                iElement.on('$destroy', function () {
                    scope.$destroy();
                });
            }
        };
    }

    angular.module('data-prep.datagrid')
        .directive('datagrid', Datagrid);
})();

