
import CONSTANTS from './vtex-catalog.constants.js';

class Private {
    constructor() {
        /**
         * API limits request
         * @type {Number}
         */
        this._maxParamsPerRequest = 50;

        /**
         * Array to store the empty params
         * @type {Array}
         */
        this._emptyFetchedParams = [];

        /**
         * Array to store the pending params to fetch
         * @type {Array}
         */
        this._pendingParamsToFetch = [];

        /**
         * Array to store the fetched params
         * @type {Array}
         */
        this._fetchedParams = [];

        /**
         * Array to store the XHR requests
         * @type {Array}
         */
        this._pendingFetchArray = [];
    }

    _getInstance(vtexUtils, catalog) {
        this._globalHelpers = vtexUtils.globalHelpers;
        this._catalog = catalog;

        this._storage = vtexUtils.storage;
        this._session = this._storage.session;
    }

    _error(type) {
        throw new Error(CONSTANTS.ERRORS[type]);
    }

    _setSessionCache(catalogCache) {
        this._catalogCache = catalogCache;
        this._initStorage();
    }

    /**
     * Init and validate Session Store Cache
     * @return {Void}
     */
    _initStorage() {
        if ( this._globalHelpers.isNull(this._session.get(CONSTANTS.PRODUCT_CACHE_NAME)) ) {
            this._session.set(CONSTANTS.PRODUCT_CACHE_NAME, {});
        }

        if ( this._globalHelpers.isNull(this._session.get(CONSTANTS.SKU_CACHE_NAME)) ) {
            this._session.set(CONSTANTS.SKU_CACHE_NAME, {});
        }
    }

    /**
     * Store products into Session Storage
     */
    _setProductCache(products) {
        if ( this._catalogCache ) {
            let productCache = this._session.get(CONSTANTS.PRODUCT_CACHE_NAME);

            for ( let id in products ) {
                if ( ! productCache.hasOwnProperty(id) ) {
                    productCache[id] = products[id];
                }
            }

            this._session.set(CONSTANTS.PRODUCT_CACHE_NAME, productCache, CONSTANTS.EXPIRE_TIME);
        }
    }

    /**
     * Store SKUs ID into Session Storage
     */
    _setSkuCache(productsId) {
        if ( this._catalogCache ) {
            let productIdCache = this._session.get(CONSTANTS.SKU_CACHE_NAME);

            for ( let id in productsId ) {
                if ( ! productIdCache.hasOwnProperty(id) ) {
                    productIdCache[id] = productsId[id];
                }
            }

            this._session.set(CONSTANTS.SKU_CACHE_NAME, productIdCache, CONSTANTS.EXPIRE_TIME);
        }
    }

    _getProductCache() {
        return ( this._catalogCache ) ? this._session.get(CONSTANTS.PRODUCT_CACHE_NAME) : this._catalog.productCache;
    }

    _getSkuCache() {
        return ( this._catalogCache ) ? this._session.get(CONSTANTS.SKU_CACHE_NAME) : this._catalog.skusProductIds;
    }

    /**
     * Cache Products/SKUs Id
     * @param {Object} product Product to cache
     */
    _setCache(product) {
        const {productId, items} = product;
        this._catalog.productCache[productId] = product;

        if ( this._catalogCache ) {
            this._setProductCache(this._catalog.productCache);
        }

        items.forEach((item) => {
            const {itemId} = item;
            this._catalog.skusProductIds[itemId] = productId;
        });
    }

    /**
     * Search products in Catalog
     * @param  {Object} params       Object with search parameters. Valid params: C:/{a}/{b} (Category), fq=specificationFilter_{a}:{b} (Filter), fq=P:[{a} TO {b}] (Price)
     * @param  {Object} [headers={}] Request headers
     * @return {Promise}             Promise with search results
     */
    _search(params, headers = {}) {
        let paramsFormatted = $.extend({}, params);
        let xhrArray = this._pendingFetchArray;
        let productData = [];

        for ( let queryType in params ) {
            if ( queryType === 'map' ) {
                continue;
            }

            // Loop each query and filter the ones that are already fetched
            // or are pending
            paramsFormatted[queryType] = params[queryType].filter((query) => {
                // Check if query was already fetched and the response was empty
                if ( ~this._emptyFetchedParams.indexOf(query) ) {
                    return false;
                }

                // NOTE: Two step validation, the first IF statement checks if the query
                // was already gotten and if the query is still pending
                if ( ~this._fetchedParams.indexOf(query) ) {
                    return false;
                } else {
                    if ( !~this._pendingParamsToFetch.indexOf(query) ) {
                        this._pendingParamsToFetch.push(query);
                        return true;
                    } else {
                        return false;
                    }
                }
            });
        }

        let paramsLength = 1;

        // If params fq is an array get the length
        if ( this._globalHelpers.isArray(params.fq) ) {
            paramsLength = paramsFormatted.fq.length;
        }

        let requestAmount = Math.ceil(paramsLength / this._maxParamsPerRequest);

        // Loop for each requestAmount
        for ( let i = 0; i < requestAmount; i += 1 ) {
            let resources = `${i * this._maxParamsPerRequest}-${((i + 1) * this._maxParamsPerRequest) - 1}`;

            /* eslint-disable */
            const searchRequest = $.Deferred();
            /* eslint-enable */

            $.ajax({
                url: CONSTANTS.SEARCH_URL,
                data: $.param(paramsFormatted, true),
                beforeSend(xhr) {
                    for ( let header in headers ) {
                        if ( {}.hasOwnProperty.call(headers, header) ) {
                            xhr.setRequestHeader(header, headers[header]);
                        }
                    }
                    xhr.setRequestHeader('resources', resources);
                },
                success(products) {
                    searchRequest.resolve(products);
                },
            });

            xhrArray.push(searchRequest.promise());
        }

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        $.when(...xhrArray).done((...requests) => {
            requests.forEach((request, index) => {
                const products = request;
                products.forEach((product) => this._setCache(product));

                // Remove resolved fetch from array
                xhrArray.splice(index, 1);
            });

            for ( let queryType in params ) {
                if ( {}.hasOwnProperty.call(params, queryType) ) {
                    params[queryType].forEach((query) => {
                        const [queryField, queryValue] = query.split(':');
                        let product;

                        // Add fetched params
                        this._fetchedParams.push(query);

                        switch (queryField) {
                            case 'skuId': {
                                const productId = this._catalog.skusProductIds[queryValue];
                                product = this._catalog.productCache[productId];
                                break;
                            }
                            case 'productId': {
                                product = this._catalog.productCache[queryValue];
                                break;
                            }
                        }

                        if ( this._globalHelpers.isUndefined(product) ) {
                            this._emptyFetchedParams.push(query);
                        } else {
                            productData.push(product);
                        }
                    });
                }
            }

            if ( productData.length ) {
                this._setSkuCache(this._catalog.skusProductIds);

                def.resolve(productData);
            } else {
                def.reject();
            }
        });

        return def.promise();
    }

    /**
     * Search products with shelf template
     * @param  {Object} params       Object with search parameters
     * @param  {Object} headers      Request headers
     * @return {Promise}             Promise with search results
     */
    _searchPage(params, headers) {
        let paramsFormatted = $.extend({}, params);
        let resources = `${this._maxParamsPerRequest}-${(this._maxParamsPerRequest) - 1}`;

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        $.ajax({
            url: '/buscapagina/',
            data: $.param(paramsFormatted, true),
            beforeSend(xhr) {
                for ( let header in headers ) {
                    if ( {}.hasOwnProperty.call(headers, header) ) {
                        xhr.setRequestHeader(header, headers[header]);
                    }
                }
                xhr.setRequestHeader('resources', resources);
            },
        })
        .then((products) => {
            def.resolve(products);
        });

        return def.promise();
    }

    /**
     * Request End Events
     * @param  {String} type  Register specific event type
     */
    _requestEndEvent(type) {
        /* eslint-disable */
        const ev = $.Event(`request${type}End.vtexCatalog`);
        /* eslint-enable */

        setTimeout(() => {
            $(document).trigger(ev);
        }, 0);
    }
}

export default Private;
