
import CONSTANTS from './vtex-catalog.constants';
import Private from './vtex-catalog.private';

const _private = new Private();

export default {
    /**
     * Sets Catalog instance
     * @return {Void}
     */
    _setInstance(vtexUtils) {
        _private._getInstance(vtexUtils, this);
    },

    setCamelize(camelize, props) {
        _private._camelizeItems = camelize;
        _private._camelizeProps = props;
    },

    setPriceInfo(priceInfo) {
        _private._priceInfo = priceInfo;
    },

    setSortSku(sortSku, sortSkuItems, sortSkuName) {
        _private._sortSku = sortSku;
        _private._sortSkuItems = sortSkuItems;
        _private._sortSkuName = sortSkuName;
    },

    setInstallmentsGroup(installmentGroup) {
        _private._installmentGroup = installmentGroup;
    },

    setShelfClass(className) {
        _private._className = this.globalHelpers.isString(className) ? className : '';
    },

    /**
     * Custom filter for products search
     * @param {Function} callback   Function with your rules
     * @example
     *     const customFilter = (product) => {
     *         product.customProperty = 'CustomProperty';
     *
     *         return product;
     *     };
     *
     *     vtexCatalog.setCustomFilter(customFilter);
     */
    setCustomFilter(callback) {
        if ( !this.globalHelpers.isFunction(callback) ) {
            return _private._error('callbackNotAFunction');
        }

        _private._setCustomFilter = callback;
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

        if ( this.productCache[productId] ) {
            def.resolve(this.productCache[productId]);
        } else {
            let params = {
                fq: [`productId:${productId}`],
            };

            const search = _private._search(params);

            search.done((products) => def.resolve((products.length) ? products[0] : false))
                .fail((...res) => def.reject(res));
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

        if ( this.skusProductIds[skuId] ) {
            def.resolve(this.productCache[this.skusProductIds[skuId]]);
        } else {
            let params = {
                fq: [`skuId:${skuId}`],
            };

            const search = _private._search(params);
            search.done((products) => def.resolve((products.length) ? products[0] : false))
                .fail((...res) => def.reject(res));
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

        if ( !this.globalHelpers.isArray(productIdArray) ) {
            return _private._error('productIdArrayNotAnArray');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        let productData = {};
        let params = {fq: []};

        for ( let i = 0, len = productIdArray.length; i < len; i += 1 ) {
            if ( this.globalHelpers.isUndefined(this.productCache[productIdArray[i]]) ) {
                params.fq.push(`productId:${productIdArray[i]}`);
            } else {
                productData[productIdArray[i]] = this.productCache[productIdArray[i]];
            }
        }

        if ( params.fq.length ) {
            const search = _private._search(params);

            search.done((products) => {
                for ( let i = 0, len = products.length; i < len; i += 1 ) {
                    productData[products[i].productId] = products[i];
                }

                def.resolve(this.globalHelpers.length(productData) ? productData : false);
            }).fail((...res) => def.reject(res));
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

        if ( !this.globalHelpers.isArray(skuIdArray) ) {
            return _private._error('skuIdArrayNotAnArray');
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        let productData = {};
        let params = {fq: []};

        for ( let i = 0, len = skuIdArray.length; i < len; i += 1 ) {
            if ( !this.skusProductIds[skuIdArray[i]] ) {
                params.fq.push(`skuId:${skuIdArray[i]}`);
            } else {
                let productId = this.skusProductIds[skuIdArray[i]];

                productData[productId] = this.productCache[productId];
            }
        }

        if ( params.fq.length ) {
            const search = _private._search(params);

            search.done((products) => {
                for ( let i = 0, len = products.length; i < len; i += 1 ) {
                    productData[products[i].productId] = products[i];
                }

                def.resolve(this.globalHelpers.length(productData) ? productData : false);
            }).fail((...res) => def.reject(res));
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

        if ( !this.globalHelpers.isObject(params) ) {
            return _private._error('searchParamsNotAnObject');
        }

        if ( !params.hasOwnProperty('fq') && !params.hasOwnProperty('ft') ) {
            return _private._error('searchItemsNotDefined');
        }

        if ( !this.globalHelpers.isArray(range) ) {
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
            _from: ( range[0] < 0 ) ? 1 : range[0] || 1,
            _to: ( range[1] < 0 ) ? 50 : range[1] || 50,
        };

        // Join params and mapParam
        $.extend(params, mapParam, rangeParam);

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        if ( (rangeParam._to - rangeParam._from) > 49 ) {
            throw new RangeError('Range must be a max value between 50 items');
        }

        $.ajax({
            url: CONSTANTS.SEARCH_URL,
            data: $.param(params, true),
            beforeSend(xhr) {
                _private._requestStartEvent();
            },
        })
        .then((res, statusText, xhr) => {
            res = res.map((item) => _private._parseCamelize(item))
                .map((item) => _private._setPriceInfo(item));

            /* eslint-disable */
            return $.Deferred().resolve(res, statusText, xhr).promise();
            /* eslint-enable */
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
     *             $('.js--list-items').append(res);
     *         })
     *         .fail(function(err) {window.console.log(err)});
     */
    searchPage(searchParams, splitList = false, headers = {}) {
        if ( this.globalHelpers.isUndefined(searchParams) ) {
            return _private._error('searchParamsNotDefined');
        }

        if ( !this.globalHelpers.isPlainObject(searchParams) ) {
            return _private._error('searchParamsNotAnObject');
        }

        if ( !searchParams.hasOwnProperty('fq') && !searchParams.hasOwnProperty('ft') ) {
            return _private._error('searchItemsNotDefined');
        }

        if ( this.globalHelpers.isUndefined(searchParams.shelfId) ) {
            return _private._error('shelfIdNotDefined');
        }

        if ( !this.globalHelpers.isString(searchParams.shelfId) ) {
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
                const $productsList = $(result).find(`li[layout=${searchParams.shelfId}]`)
                    .removeClass('first last')
                    .removeAttr('layout')
                    .addClass(_private._className);

                def.resolve($productsList);
            } else {
                def.resolve(result);
            }
        }).fail((err) => def.reject(err));

        def.then(() => _private._requestEndEvent('SearchPage'));

        return def.promise();
    },

    searchFacets() {
        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        _private._searchFacets()
            .then((res) => def.resolve(res))
            .fail((err) => def.reject(err));

        return def.promise();
    },
};
