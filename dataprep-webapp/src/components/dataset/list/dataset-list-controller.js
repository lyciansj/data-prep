(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name data-prep.dataset-list.controller:DatasetListCtrl
     * @description Dataset list controller.
     On creation, it fetch dataset list from backend and load playground if 'datasetid' query param is provided
     * @requires data-prep.services.state.service:StateService
     * @requires data-prep.services.dataset.service:DatasetService
     * @requires data-prep.services.dataset.service:DatasetListSortService
     * @requires data-prep.services.playground.service:PlaygroundService
     * @requires talend.widget.service:TalendConfirmService
     * @requires data-prep.services.utils.service:MessageService
     * @requires data-prep.services.uploadWorkflowService.service:UploadWorkflowService
     * @requires data-prep.services.state.service:StateService
     * @requires data-prep.services.datasetWorkflowService:UpdateWorkflowService
     * @requires data-prep.services.folder.service:FolderService
     * @requires data-prep.services.preparation.service:PreparationListService
     */
    function DatasetListCtrl($scope, $translate, $stateParams, StateService, DatasetService, DatasetListSortService, PlaygroundService,
                             TalendConfirmService, MessageService, UploadWorkflowService, UpdateWorkflowService, FolderService, state, PreparationListService) {
        var vm = this;

        vm.datasetService = DatasetService;
        vm.uploadWorkflowService = UploadWorkflowService;
        vm.state = state;

        /**
         * @ngdoc property
         * @name folderName
         * @propertyOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description The folder name
         * @type {String}
         */
        vm.folderName = '';

        /**
         * @ngdoc property
         * @name sortList
         * @propertyOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description The sort list
         * @type {array}
         */
        vm.sortList = DatasetListSortService.getSortList();

        /**
         * @ngdoc property
         * @name orderList
         * @propertyOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description The sort order list
         * @type {string}
         */
        vm.orderList = DatasetListSortService.getOrderList();

        /**
         * @ngdoc property
         * @name sortSelected
         * @propertyOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Selected sort.
         * @type {object}
         */
        vm.sortSelected = DatasetListSortService.getSortItem();

        /**
         * @ngdoc property
         * @name sortOrderSelected
         * @propertyOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Selected sort order.
         * @type {object}
         */
        vm.sortOrderSelected = DatasetListSortService.getOrderItem();

        /**
         * @type {boolean} display or not folder search result
         */
        vm.displayFoldersList = false;

        /**
         * @type {Array} folder found after a search
         */
        vm.foldersFound = [];

        /**
         * @type {string} name used for dataset clone
         */
        vm.cloneName = '';

        /**
         * @ngdoc method
         * @name sort
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description sort dataset by sortType by calling refreshDatasets from DatasetService
         * @param {object} sortType Criteria to sort
         */
        vm.updateSortBy = function (sortType) {
            if (vm.sortSelected === sortType) {
                return;
            }

            var oldSort = vm.sortSelected;
            vm.sortSelected = sortType;
            DatasetListSortService.setSort(sortType.id);

            FolderService.getFolderContent(state.folder.currentFolder)
                .catch(function () {
                    vm.sortSelected = oldSort;
                    DatasetListSortService.setSort(oldSort.id);
                });
        };

        /**
         * @ngdoc method
         * @name sort
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description sort dataset in order (ASC or DESC) by calling refreshDatasets from DatasetService
         * @param {object} order Sort order ASC(ascending) or DESC(descending)
         */
        vm.updateSortOrder = function (order) {
            if (vm.sortOrderSelected === order) {
                return;
            }

            var oldSort = vm.sortOrderSelected;
            vm.sortOrderSelected = order;
            DatasetListSortService.setOrder(order.id);

            FolderService.getFolderContent(state.folder.currentFolder)
                .catch(function () {
                    vm.sortOrderSelected = oldSort;
                    DatasetListSortService.setOrder(oldSort.id);
                });
        };

        /**
         * @ngdoc method
         * @name open
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description [PRIVATE] Initiate a new preparation from dataset
         * @param {object} dataset The dataset to open
         */
        var open = function (dataset) {
            PlaygroundService.initPlayground(dataset)
                .then(StateService.showPlayground);
        };

        /**
         * @ngdoc method
         * @name uploadUpdatedDatasetFile
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description [PRIVATE] updates the existing dataset with the uploadd one
         */
        vm.uploadUpdatedDatasetFile = function uploadUpdatedDatasetFile(dataset) {
            UpdateWorkflowService.updateDataset(vm.updateDatasetFile[0], dataset);
        };

        /**
         * @ngdoc method
         * @name delete
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Delete a dataset
         * @param {object} dataset - the dataset to delete
         */
        vm.delete = function (dataset) {
            TalendConfirmService.confirm({disableEnter: true}, ['DELETE_PERMANENTLY', 'NO_UNDONE_CONFIRM'], {
                    type: 'dataset',
                    name: dataset.name
                })
                .then(function () {
                    return DatasetService.delete(dataset);
                })
                .then(function () {
                    vm.goToFolder(state.folder.currentFolder);
                    MessageService.success('REMOVE_SUCCESS_TITLE', 'REMOVE_SUCCESS', {
                        type: 'dataset',
                        name: dataset.name
                    });
                });
        };

        /**
         * @ngdoc method
         * @name clone
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description perform the dataset cloning to the folder destination
         */
        vm.clone = function(){

            vm.cloneNameForm.$commitViewValue();

            DatasetService.clone(vm.datasetToClone,vm.folderDestination,vm.cloneName).then(function (){
                        MessageService.success('CLONE_SUCCESS_TITLE', 'CLONE_SUCCESS');
                    }).finally(function () {
                        // reset some values to initial values
                        vm.folderDestinationModal = false;
                        vm.datasetToClone = null;
                        vm.folderDestination = null;
                        vm.foldersFound = [];
                        vm.displayFoldersList = false;
                        vm.cloneName = '';
                    });
        };

        /**
         * @ngdoc method
         * @name rename
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @param {object} dataset The dataset to rename
         * @param {string} name The new name
         * @description Rename a dataset
         */
        vm.rename = function rename(dataset, name) {
            var cleanName = name ? name.trim() : '';
            if (cleanName) {
                if (dataset.renaming) {
                    return;
                }
                var nameAlreadyUsed = false;
                _.forEach(vm.currentFolderContent.datasets, function(dataset){
                    if (cleanName === dataset.name){
                        nameAlreadyUsed = true;
                        return;
                    }
                });

                if (nameAlreadyUsed){
                    MessageService.error('DATASET_NAME_ALREADY_USED_TITLE', 'DATASET_NAME_ALREADY_USED');
                    return;
                }

                dataset.renaming = true;
                var oldName = dataset.name;
                dataset.name = name;
                return DatasetService.update(dataset)
                    .then(function () {
                        MessageService.success('DATASET_RENAME_SUCCESS_TITLE',
                            'DATASET_RENAME_SUCCESS');
                        PreparationListService.refreshMetadataInfos(state.folder.currentFolderContent.datasets)
                            .then(function(preparations){
                                FolderService.refreshDefaultPreparationForCurrentFolder(preparations);
                            });

                    }).catch(function () {
                        dataset.name = oldName;
                    }).finally(function () {
                        dataset.renaming = false;
                    });
            }
        };

        /**
         * @ngdoc method
         * @name loadUrlSelectedDataset
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description [PRIVATE] Load playground with provided dataset id, if present in route param
         * @param {object[]} datasets List of all user's datasets
         */
        var loadUrlSelectedDataset = function loadUrlSelectedDataset(datasets) {
            if ($stateParams.datasetid) {
                var selectedDataset = _.find(datasets, function (dataset) {
                    return dataset.id === $stateParams.datasetid;
                });

                if (selectedDataset) {
                    open(selectedDataset);
                }
                else {
                    MessageService.error('PLAYGROUND_FILE_NOT_FOUND_TITLE', 'PLAYGROUND_FILE_NOT_FOUND', {type: 'dataset'});
                }
            }
        };


        /**
         * @ngdoc method
         * @name processCertification
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description [PRIVATE] Ask certification for a dataset
         * @param {object[]} dataset Ask certification for the dataset
         */
        vm.processCertification = function (dataset) {
            vm.datasetService.processCertification(dataset).then(
                function() {
                    vm.goToFolder(state.folder.currentFolder);
                }
            );
        };

        //-------------------------------
        // Folder
        //-------------------------------

        /**
         * @ngdoc method
         * @name actionsOnAddFolderClick
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description run these action when clicking on Add Folder button
         */
        vm.actionsOnAddFolderClick = function(){
            vm.folderNameModal = true;
            vm.folderName = '';
        };

        /**
         * @ngdoc method
         * @name addFolder
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Create a new folder
         */
        vm.addFolder = function(){

            vm.folderNameForm.$commitViewValue();

            var pathToCreate = (state.folder.currentFolder.id?state.folder.currentFolder.id:'') + '/' + vm.folderName;
            FolderService.create( pathToCreate )
                .then(function() {
                    vm.goToFolder(state.folder.currentFolder);
                    vm.folderNameModal = false;
                });
        };

        /**
         * @ngdoc method
         * @name goToFolder
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @param {object} folder - the folder to go
         * @description Go to the folder given as parameter
         */
        vm.goToFolder = function(folder){
            FolderService.getFolderContent(folder);
        };

        /**
         * @ngdoc method
         * @name renameFolder
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Rename a folder
         * @param {string} path the path to rename
         * @param {string} newPath the new last part of the path
         */
        vm.renameFolder = function(path, newPath){
            // the service only use full path so we build the new full folder path
            var n = path.lastIndexOf('/');
            var str = path;
            str = str.substring(0,n) + '/' + newPath;
            FolderService.renameFolder(path, str)
                .then(function() {
                    vm.goToFolder(state.folder.currentFolder);
                    // or to newOne?
                });
        };


        /**
         * @ngdoc method
         * @name openFolderChoice
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Display folder destination choice modal
         * @param {object} dataset - the dataset to clone or move
         */
        vm.openFolderChoice = function(dataset) {
            vm.datasetToClone = dataset;
            vm.displayFoldersList = false;
            vm.foldersFound = [];
            vm.searchFolderQuery = '';
            vm.cloneName = dataset.name + ' Copy';
            // ensure nothing is null
            var toggleToCurrentFolder = state.folder && state.folder.currentFolder && state.folder.currentFolder.id;

            if (toggleToCurrentFolder) {
                var pathParts = state.folder.currentFolder.id.split( '/' );
                var currentPath = pathParts[0];
            }

            var rootFolder = {id: '', path: '', collapsed: false, name: $translate.instant('HOME_FOLDER')};

            FolderService.children()
                .then(function(res) {
                    rootFolder.nodes = res.data;
                    vm.folders = [rootFolder];
                    _.forEach(vm.folders[0].nodes,function(folder){
                        folder.collapsed = true;
                        // recursive toggle until we reach the current folder
                        if (toggleToCurrentFolder && folder.id===currentPath){
                            vm.toggle(folder, pathParts.length>0?_.slice(pathParts,1):null,currentPath);
                        }
                    });
                    vm.folderDestinationModal = true;
                });

        };

        /**
         * @ngdoc method
         * @name toggle
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description load folder children
         * @param {object} node - the folder to display children
         * @param {array} contains all path parts
         * @param {string} the current path for recursive call
         */
        vm.toggle = function (node,pathParts,currentPath) {
            if (!node.collapsed){
                node.collapsed = true;
            } else {
                if (!node.nodes) {
                    FolderService.children( node.id )
                        .then(function(res){
                            node.nodes = res.data ? res.data : [];
                            vm.collapseNodes(node);
                            if(pathParts && pathParts[0]){
                                currentPath += currentPath ? '/' + pathParts[0] : pathParts[0];
                                _.forEach(node.nodes,function(folder){
                                    if(folder.id===currentPath) {
                                        vm.toggle(folder,pathParts.length>0?_.slice(pathParts,1):null, currentPath);
                                    }
                                });

                            }
                        });

                } else {
                    vm.collapseNodes(node);
                }
            }
        };


        /**
         * @ngdoc method
         * @name chooseFolder
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Set folder destination choice
         * @param {object} folder - the folder to use for cloning the dataset
         */
        vm.chooseFolder = function(folder){
            if (folder.selected===true){
                folder.selected=false;
            } else {
                var previousSelected = vm.folderDestination;
                if (previousSelected){
                    previousSelected.selected = false;
                }
                vm.folderDestination = folder;
                folder.selected=true;
            }
        };

        /**
         * @ngdoc method
         * @name collapseNodes
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description utility function to collapse nodes
         * @param {object} node - parent node of childs to collapse
         */
        vm.collapseNodes = function(node){
            _.forEach(node.nodes,function(folder){
                folder.collapsed = true;
            });
            if (node.nodes.length > 0 ) {
                node.collapsed = false;
            } else {
                node.collapsed = !node.collapsed;
            }
        };

        /**
         * @ngdoc method
         * @name updateSearchFolderQuery
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description trigger when searchFolderQuery get changed trigger a search only if search folder query has a minimum of 3 characters
         */
        vm.onSearchFolderQueryChange = function(){
            if (vm.searchFolderQuery && vm.searchFolderQuery.length>2){
                vm.searchFolders();
            } else {
                vm.foldersFound = [];
                vm.displayFoldersList = false;
            }
        };

        /**
         * @ngdoc method
         * @name searchFolders
         * @methodOf data-prep.dataset-list.controller:DatasetListCtrl
         * @description Search folders
         */
        vm.searchFolders = function(){
            FolderService.searchFolders(vm.searchFolderQuery)
                .then(function(response){
                    vm.foldersFound = response.data;
                    vm.displayFoldersList = true;
                });
        };

        // load the datasets
        DatasetService
            .getDatasets()
            .then(loadUrlSelectedDataset);
    }

    /**
     * @ngdoc property
     * @name datasets
     * @propertyOf data-prep.dataset-list.controller:DatasetListCtrl
     * @description The dataset list.
     * This list is bound to {@link data-prep.services.dataset.service:DatasetService DatasetService}.datasetsList()
     */
    Object.defineProperty(DatasetListCtrl.prototype,
        'datasets', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.datasetService.datasetsList();
            }
        });

    /**
     * @ngdoc property
     * @name currentFolderContent
     * @propertyOf data-prep.folder.controller:FolderCtrl
     * @description The folder content list.
     * This list is bound to {@link data-prep.services.state.service:FolderStateService}.state.currentFolderContent
     */
    Object.defineProperty(DatasetListCtrl.prototype,
        'currentFolderContent', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.state.folder.currentFolderContent;
            }
        });

    angular.module('data-prep.dataset-list')
        .controller('DatasetListCtrl', DatasetListCtrl);
})();
