/*  ============================================================================

 Copyright (C) 2006-2018 Talend Inc. - www.talend.com

 This source code is available under agreement available at
 https://github.com/Talend/data-prep/blob/master/LICENSE

 You should have received a copy of the agreement
 along with this program; if not, write to Talend SA
 9 rue Pages 92150 Suresnes, France

 ============================================================================*/

/**
 * @ngdoc service
 * @name data-prep.services.search.inventory:InventoryRestService
 * @description Inventory service.
 */
export default function InventoryRestService($http, RestURLs, UrlService) {
	'ngInject';

	return {
		search,
	};

    /**
     * @ngdoc method
     * @name search
     * @methodOf data-prep.services.search.inventory:InventoryRestService
     * @param {String} searchString The string to search
     * @param {Promise} deferredAbort abort request when resolved
     */
	function search(searchString = '', deferredAbort) {
		return $http({
			url: UrlService.build(
				`${RestURLs.searchUrl}`,
				{
					path: '/',
					name: searchString,
				},
			),
			method: 'GET',
			timeout: deferredAbort.promise,
			failSilently: true,
		});
	}
}
