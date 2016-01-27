describe('InventoryItem directive', function () {
    'use strict';

    function strEndsWith(str, suffix) {
        return str.match(suffix + '$')[0] === suffix;
    }

    var scope,  createElement, element;
    var dataset = {
        'id': '12ce6c32-bf80-41c8-92e5-66d70f22ec1f',
        'name': 'US States',
        'author': 'anonymousUser',
        'created': '1437020219741',
        'type': 'text/csv',
        'certificationStep': 'NONE',
        'defaultPreparations': [{name:'US States prepa'}, {name:'US States prepa 2'}]
    };


    beforeEach(module('data-prep.inventory-item'));

    beforeEach(module('htmlTemplates'));
    beforeEach(module('pascalprecht.translate', function ($translateProvider) {
        $translateProvider.translations('en', {
            'INVENTORY_DETAILS': 'owned by {{author}}, created {{created | TDPMoment}}, contains {{records}} lines'
        });
        $translateProvider.preferredLanguage('en');
    }));

    afterEach(function () {
        scope.$destroy();
        element.remove();
    });

    describe('should display actions', function() {
        beforeEach(inject(function ($rootScope, $compile) {
            scope = $rootScope.$new();

            scope.dataset = dataset;
            scope.openDataset = function(){};
            scope.openRelatedInv = function(){};
            scope.copy = function(){};
            scope.remove = function(){};
            scope.defaultPreparations = [];
            createElement = function () {
                element = angular.element('<inventory-item ' +
                    'item="dataset" ' +
                    'actions-enabled="true" ' +
                    'details="INVENTORY_DETAILS" ' +
                    'type= "dataset" ' +
                    'related-inventories="defaultPreparations" ' +
                    'related-inventories-type="preparation" ' +
                    'open-related-inv="openPreparation" ' +
                    'open="openDataset" ' +
                    'copy="copy" ' +
                    'remove="remove"' +
                    '></inventory-item>');
                $compile(element)(scope);
                scope.$digest();
                return element;
            };
        }));

        it('should render dataset directive', inject(function ($filter) {
            //given
            var momentize = $filter('TDPMoment');

            //when
            createElement();

            //then
            var icon = element.find('.inventory-icon').eq(0);
            var iconSrc = icon.find('> img')[0].src;
            var certificationIcon = icon.find('.pin');
            expect(strEndsWith(iconSrc, '/assets/images/inventory/csv_file.png')).toBe(true);
            expect(certificationIcon.length).toBe(0);
            expect(element.find('.inventory-title').eq(0).text().indexOf('US States')).toBe(0);
            expect(element.find('.inventory-description').eq(0).text()).toBe('owned by anonymousUser, created ' + momentize('1437020219741') + ', contains  lines');
            expect(element.find('a').length).toBe(3); //copy, remove and toogleFavourite actions
        }));
    });
});
