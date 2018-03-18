
import CONSTANTS from './vtex-catalog.constants.js';
import Private from './vtex-catalog.private.js';

const _private = new Private();

export default {
    /**
     * Sets Catalog instance
     * @return {Void}
     */
    _setInstance(vtexUtils, catalogCache) {
        _private._getInstance(vtexUtils, this);
        _private._setSessionCache(catalogCache);
    },

    setEventTime(time) {
        _private._eventTime = this.globalHelpers.isNumber(time) ? time : CONSTANTS.EVENT_TIME;
    },

    setShelfClass(className) {
        _private._className = this.globalHelpers.isString(className) ? className : '';
    },

    getProductCache() {
        return _private._getProductCache();
    },

    getSkusProductId() {
        return _private._getSkuCache();
    },

    /**
     * Search by product ID
     * @param  {Number} productId ID of the product to search
     * @return {Promise}                    Promise with search results
     */
    searchProduct(productId) {
        if ( this.globalHelpers.isUndefined(productId) ) {
            return _private._error('productIdNotDefined');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        const _productCache = _private._getProductCache();

        if ( _productCache[productId] ) {
            def.resolve(_productCache[productId]);
        } else {
            let params = {
                fq: [`productId:${productId}`],
            };

            const search = _private._search(params);

            // Since it should be only 1 item set index is 0
            search.done((products) => def.resolve(products[0]));
        }

        def.then(() => _private._requestEndEvent('Product'));

        return def.promise();
    },

    /**
     * Search by sku ID
     * Sku methods stores in
     * @param  {Number} skuId ID of the sku to search
     * @return {Promise}            Promise with search results
     */
    searchSku(skuId) {
        if ( this.globalHelpers.isUndefined(skuId) ) {
            return _private._error('skuIdNotDefined');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        const _productCache = _private._getProductCache();
        const _skuCache = _private._getSkuCache();

        if ( _skuCache[skuId] ) {
            def.resolve(_productCache[_skuCache[skuId]]);
        } else {
            let params = {
                fq: [`skuId:${skuId}`],
            };

            const search = _private._search(params);

            // Since it should be only 1 item set index is 0
            search.done((products) => def.resolve(products[0]));
        }

        def.then(() => _private._requestEndEvent('Sku'));

        return def.promise();
    },

    /**
     * Search by product ID array
     * @param  {Array} productIdArray Array IDs of the prodcuts to search
     * @return {Promise}                            Promise with search results
     */
    searchProductArray(productIdArray) {
        if ( this.globalHelpers.isUndefined(productIdArray) ) {
            return _private._error('productIdArrayNotDefined');
        }

        if ( ! this.globalHelpers.isArray(productIdArray) ) {
            return _private._error('productIdArrayNotAnArray');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        let productData = {};
        let params = {fq: []};
        const _productCache = _private._getProductCache();

        for ( let i = 0, len = productIdArray.length; i < len; i += 1 ) {
            if ( this.globalHelpers.isUndefined(_productCache[productIdArray[i]]) ) {
                params.fq.push(`productId:${productIdArray[i]}`);
            } else {
                productData[productIdArray[i]] = _productCache[productIdArray[i]];
            }
        }

        if ( params.fq.length ) {
            const search = _private._search(params);

            search.done((products) => {
                for ( let i = 0, len = products.length; i < len; i += 1 ) {
                    productData[products[i].productId] = products[i];
                }

                def.resolve(productData);
            });
        } else {
            def.resolve(productData);
        }

        def.then(() => _private._requestEndEvent('ProductArray'));

        return def.promise();
    },

    /**
     * Search by sku ID array
     * @param  {Array} skuIdArray Array IDs of the skus to search
     * @return {Promise}                    Promise with search results
     */
    searchSkuArray(skuIdArray) {
        if ( this.globalHelpers.isUndefined(skuIdArray) ) {
            return _private._error('skuIdArrayNotDefined');
        }

        if ( ! this.globalHelpers.isArray(skuIdArray) ) {
            return _private._error('skuIdArrayNotAnArray');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        let productData = {};
        let params = {fq: []};
        const _productCache = _private._getProductCache();
        const _skuCache = _private._getSkuCache();

        for ( let i = 0, len = skuIdArray.length; i < len; i += 1 ) {
            if ( ! _skuCache[skuIdArray[i]] ) {
                params.fq.push(`skuId:${skuIdArray[i]}`);
            } else {
                const productId = _skuCache[skuIdArray[i]];
                productData[productId] = _productCache[productId];
            }
        }

        if ( params.fq.length ) {
            const search = _private._search(params);

            search.done((products) => {
                for ( let i = 0, len = products.length; i < len; i += 1 ) {
                    productData[products[i].productId] = products[i];
                }

                def.resolve(productData);
            });
        } else {
            def.resolve(productData);
        }

        def.then(() => _private._requestEndEvent('SkuArray'));

        return def.promise();
    },

    /**
     * Perform a full search
     * @param  {Object} params           An Object with search params
     * @param  {Array} [range=[1, 30]]   An Array with range results
     * @return {Promise}                 Promise with search results
     * @example
     *     vtexCatalog.fullSearch({fq: ['H:143', 'C:8/81/84', 'P:[0 TO 500]']}, [1, 5])
     *         .then((res) => window.console.log(res))
     *         .fail((err) => window.console.log(err));
     */
    searchDefault(params, range = []) {
        if ( this.globalHelpers.isUndefined(params) ) {
            return _private._error('searchParamsNotDefined');
        }

        if ( ! this.globalHelpers.isObject(params) ) {
            return _private._error('searchParamsNotAnObject');
        }

        if ( ! params.hasOwnProperty('fq') && ! params.hasOwnProperty('ft') ) {
            return _private._error('searchItemsNotDefined');
        }

        if ( ! this.globalHelpers.isArray(range) ) {
            return _private._error('searchRangeNotArray');
        }

        let mapParam = {map: []};

        if ( params.hasOwnProperty('fq') ) {
            // Loop each parameter
            for ( let i = 0, len = params.fq.length; i < len; i += 1 ) {
                let param = params.fq[i];

                // If param is the category one
                if ( param.match('C:')) {
                    // Generate a 'c' param in the 'mapParam' for each category
                    let categoryIds = param.split('/');

                    for ( let z = 0, len = categoryIds.length; z < len; z += 1 ) {
                        // If the 'categoryId' is a number
                        if ( categoryIds[z].match(/\d.+/gi) ) {
                            mapParam.map.push('c');
                        }
                    }
                }

                // If param is priceFrom
                if ( param.match(/P\[.+[\d\w\s]?\]/g) ) {
                    mapParam.map.push('priceFrom');
                }
            }

            // Join mapParam map to generate a string and push it into the params object
            mapParam.map = mapParam.map.join(',');
        }

        const rangeParam = {
            _from: ( ( range[0] < 1 ) ? 1 : range[0] ) || 1,
            _to: ( ( range[1] > 50 ) ? 50 : range[1] ) || 50,
        };

        // Join params and mapParam
        $.extend(params, mapParam, rangeParam);

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        $.ajax({
            url: CONSTANTS.SEARCH_URL,
            data: $.param(params, true),
            beforeSend(xhr) {
                xhr.setRequestHeader('resources', '0-49');
            },
        })
        .done((...results) => def.resolve(...results))
        .fail((err) => def.reject(err));

        def.then(() => _private._requestEndEvent('SearchDefault'));

        return def.promise();
    },

    /**
     * Search products with shelf template
     * @param  {Object} searchParams        Object with search parameters
     * @param  {Boolean} [splitList=false]  Split <li> items if true, or return full HTML
     * @param  {Object} [headers={}]        Request headers
     * @return {Promise}                    Promise with search results
     * @example
     *     var params = {
     *         // Can be used with 'fq' or 'ft' search
     *         // fq: items, // products id array
     *         // ft: 'camisa', // search string
     *
     *         quantity: 10, // default: items length with 'fq' | 10 with 'ft'
     *         shelfId: '85e23371-f0a2-43c2-a6ac-e5464c462fb3', // required
     *         order: 'OrderByPriceASC', // default: ''
     *         columns: 3, // default: 100
     *     };
     *     var splitList = true;
     *
     *     vtexCatalog.searchPage(params, splitList)
     *         .then(function(res) {
     *             window.console.log(res);
     *             $('.js--listitems').append(res);
     *         })
     *         .fail(function(err) {window.console.log(err)});
     */
    searchPage(searchParams, splitList = false, headers = {}) {
        if ( this.globalHelpers.isUndefined(searchParams) ) {
            return _private._error('searchParamsNotDefined');
        }

        if ( ! this.globalHelpers.isPlainObject(searchParams) ) {
            return _private._error('searchParamsNotAnObject');
        }

        if ( ! searchParams.hasOwnProperty('fq') && ! searchParams.hasOwnProperty('ft') ) {
            return _private._error('searchItemsNotDefined');
        }

        if ( this.globalHelpers.isUndefined(searchParams.shelfId) ) {
            return _private._error('shelfIdNotDefined');
        }

        if ( ! this.globalHelpers.isString(searchParams.shelfId) ) {
            return _private._error('shelfIdNotAString');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        let conditionalParams = {};
        let defaultParams = {
            sl: searchParams.shelfId,
            cc: searchParams.columns || 100,
            sm: searchParams.sm || 0,
            O: searchParams.order || '',
            PageNumber: searchParams.page || 1,
        };

        if ( searchParams.hasOwnProperty('fq') ) {
            conditionalParams = {
                fq: [],
                ps: searchParams.quantity || this.globalHelpers.length(searchParams.fq),
            };

            for ( let i = 0, len = searchParams.fq.length; i < len; i += 1 ) {
                conditionalParams.fq.push(`productId:${searchParams.fq[i]}`);
            }
        }

        if ( searchParams.hasOwnProperty('ft') ) {
            conditionalParams = {
                ft: searchParams.ft,
                ps: searchParams.quantity || 10,
            };
        }

        const params = $.extend({}, conditionalParams, defaultParams);
        const search = _private._searchPage(params, headers);
        search.done((result) => {
            if ( splitList ) {
                const $productsList = $(result).find(`li[layout=${searchParams.shelfId}]`).removeAttr('layout').addClass(_private._className);

                def.resolve($productsList);
            } else {
                def.resolve(result);
            }
        })
        .fail((err) => def.reject(err));

        def.then(() => _private._requestEndEvent('SearchPage'));

        return def.promise();
    },
};
