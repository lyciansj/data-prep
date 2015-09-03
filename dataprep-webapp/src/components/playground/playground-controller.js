(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name data-prep.playground.controller:PlaygroundCtrl
     * @description Playground controller.<br/>
     * Watchers :
     * <ul>
     *     <li>Recipe length : display recipe panel on first step application</li>
     * </ul>
     * @requires data-prep.services.playground.service:PlaygroundService
     * @requires data-prep.services.preparation.service:PreparationService
     * @requires data-prep.services.playground.service:PreviewService
     */
    function PlaygroundCtrl($state, $stateParams, state, StateService, PlaygroundService, PreparationService, PreviewService, RecipeService, RecipeBulletService) {
        var vm = this;
        vm.playgroundService = PlaygroundService;
        vm.previewService = PreviewService;
        vm.recipeService = RecipeService;
        vm.state = state;

        /**
         * @ngdoc property
         * @name showNameValidation
         * @propertyOf data-prep.playground.controller:PlaygroundCtrl
         * @description Flag that controls the display of the save/discard window on implicit preparation close.
         */
        vm.showNameValidation = false;

        //--------------------------------------------------------------------------------------------------------------
        //------------------------------------------------------RECIPE--------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        /**
         * @ngdoc method
         * @name toggleRecipe
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description Toggle all the steps of the recipe
         */
        vm.toggleRecipe = RecipeBulletService.toggleRecipe;

        //--------------------------------------------------------------------------------------------------------------
        //--------------------------------------------------RECIPE HEADER-----------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        /**
         * @ngdoc property
         * @name sampleSizes
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description List all the available sample size.
         */
        vm.sampleSizes = [
            {display:'50', value: 50},
            {display:'100', value: 100},
            {display:'500', value: 500},
            {display:'full dataset', value: 'full'}
        ];
        vm.playgroundService.selectedSampleSize=vm.sampleSizes[1];

        /**
         * @ngdoc method
         * @name toggleEditionMode
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description Toggle the edition mode flag
         */
        vm.toggleEditionMode = function toggleEditionMode() {
            var editionMode = state.playground.nameEditionMode;
            StateService.setNameEditionMode(!editionMode);
        };

        /**
         * @ngdoc method
         * @name confirmPrepNameEdition
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description Change the preparation name
         */
        vm.confirmPrepNameEdition = function confirmPrepNameEdition(){
            var cleanName = vm.preparationName.trim();
            if(!vm.changeNameInProgress && cleanName) {
                vm.toggleEditionMode();
                changeName(cleanName)
                    .then(function() {
                        return $state.go('nav.home.preparations', {prepid : PreparationService.currentPreparationId}, {location:'replace', inherit:false} );
                    })
                    .catch(vm.toggleEditionMode);
            }
        };

        /**
         * @ngdoc method
         * @name cancelPrepNameEdition
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description cancels the new preparation name and sets the preparation name to the original one
         */
        vm.cancelPrepNameEdition = function cancelPrepNameEdition(){
            vm.preparationName = PlaygroundService.originalPreparationName;
            vm.toggleEditionMode();
        };

        //--------------------------------------------------------------------------------------------------------------
        //---------------------------------------------------PREPARATION------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        /**
         * @ngdoc method
         * @name changeName
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description [PRIVATE] Create a preparation or update existing preparation name if it already exists
         * @param {string} name The preparation name
         * @returns {Promise} The create/update promise
         */
        function changeName(name) {
            vm.changeNameInProgress = true;
            return PlaygroundService.createOrUpdatePreparation(name)
                .finally(function() {
                    vm.changeNameInProgress = false;
                });
        }

        //--------------------------------------------------------------------------------------------------------------
        //------------------------------------------------------CLOSE---------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        /**
         * @ngdoc method
         * @name hideAll
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description [PRIVATE] Hide all the modals (playground and save/discard)
         */
        function hideAll() {
            vm.showNameValidation = false;
            StateService.hidePlayground();
        }

        /**
         * @ngdoc method
         * @name beforeClose
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description When the preparation is an implicit preparation, we show the save/discard modal and block the playground close.
         * @returns {boolean} True if the playground can be closed (no implicit preparation), False otherwise
         */
        vm.beforeClose = function beforeClose() {
            var isImplicitPreparation = PreparationService.currentPreparationId && !PlaygroundService.originalPreparationName;
            if(isImplicitPreparation) {
                vm.showNameValidation = true;
                return false;
            }
            return true;
        };

        /**
         * @ngdoc method
         * @name discardSaveOnClose
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description Discard implicit preparation save. This trigger a preparation delete.
         */
        vm.discardSaveOnClose = function discardSaveOnClose() {
            PreparationService.deleteCurrentPreparation()
                .then(hideAll);
        };

        /**
         * @ngdoc method
         * @name confirmSaveOnClose
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description Save implicit preparation with provided name. The playground is then closed.
         */
        vm.confirmSaveOnClose = function confirmSaveOnClose() {
            vm.saveInProgress = true;
            var cleanName = vm.preparationName.trim();
            changeName(cleanName)
                .then(vm.toggleEditionMode)
                .then(hideAll)
                .finally(function() {
                    vm.saveInProgress = false;
                });
        };

        /**
         * @ngdoc method
         * @name close
         * @methodOf data-prep.playground.controller:PlaygroundCtrl
         * @description Playground close callback. It change the location and refresh the preparations if needed
         */
        vm.close = function() {
            PreparationService.refreshPreparations();
            if($stateParams.prepid) {
                $state.go('nav.home.preparations', {prepid: null});
            }
            else if($stateParams.datasetid) {
                $state.go('nav.home.datasets', {datasetid: null});
            }
        };
    }

    /**
     * @ngdoc property
     * @name metadata
     * @propertyOf data-prep.playground.controller:PlaygroundCtrl
     * @description The loaded metadata
     * It is bound to {@link data-prep.services.playground.service:PlaygroundService PlaygroundService} property
     */
    Object.defineProperty(PlaygroundCtrl.prototype,
        'metadata', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.state.playground.dataset;
            }
        });

    /**
     * @ngdoc property
     * @name preparationName
     * @propertyOf data-prep.playground.controller:PlaygroundCtrl
     * @description The preparation name
     * It is bound to {@link data-prep.services.playground.service:PlaygroundService PlaygroundService} property
     */
    Object.defineProperty(PlaygroundCtrl.prototype,
        'preparationName', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.playgroundService.preparationName;
            },
            set: function(value) {
                this.playgroundService.preparationName = value;
            }
        });

    /**
     * @ngdoc property
     * @name selectedSampleSize
     * @propertyOf data-prep.playground.controller:PlaygroundCtrl
     * @description The selected sample size
     * It is bound to {@link data-prep.services.playground.service:PlaygroundService PlaygroundService} property
     */
    Object.defineProperty(PlaygroundCtrl.prototype,
        'selectedSampleSize', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.playgroundService.selectedSampleSize;
            },
            set: function(value) {
                this.playgroundService.selectedSampleSize = value;
            }
        });

    /**
     * @ngdoc property
     * @name previewInProgress
     * @propertyOf data-prep.playground.controller:PlaygroundCtrl
     * @description Flag that defines if a preview is in progress
     * It is bound to {@link data-prep.services.dataset.service:PreviewService PreviewService} property
     */
    Object.defineProperty(PlaygroundCtrl.prototype,
        'previewInProgress', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.previewService.previewInProgress();
            }
        });

    /**
     * @ngdoc property
     * @name hasRecipe
     * @propertyOf data-prep.playground.controller:PlaygroundCtrl
     * @description Checks if there are steps in the preparation
     * It is bound to {@link data-prep.services.recipe.service:RecipeService RecipeService}.getRecipe() length
     * @type boolean
     */
    Object.defineProperty(PlaygroundCtrl.prototype,
        'hasRecipe', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.recipeService.getRecipe().length;
            }
        });

    /**
     * @ngdoc property
     * @name hasActiveStep
     * @propertyOf data-prep.playground.controller:PlaygroundCtrl
     * @description checks if there is at least 1 active step, by checking the 1st step in the recipe
     * It is bound to {@link data-prep.services.recipe.service:RecipeService RecipeService} status of the 1st step in the returned recipe array by the getRecipe() function
     * @type boolean
     */
    Object.defineProperty(PlaygroundCtrl.prototype,
        'hasActiveStep', {
            enumerable: true,
            configurable: false,
            get: function () {
                var firstStep = this.recipeService.getRecipe()[0];
                return firstStep && !firstStep.inactive;
            },
            set: function () {}
        });

    angular.module('data-prep.playground')
        .controller('PlaygroundCtrl', PlaygroundCtrl);
})();

