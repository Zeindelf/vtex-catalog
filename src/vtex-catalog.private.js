
import CONSTANTS from './vtex-catalog.constants';

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

        /**
         * Sets camelize response props
         * @type {Boolean}
         */
        this._camelizeItems = false;
        this._camelizeProps = false;

        /**
         * Sets all price info
         * @type {Boolean}
         */
        this._priceInfo = false;

        /**
         * Sort sku items
         * @type {Mix}
         */
        this._sortSku = false;
        this._sortSkuItems = [];
        this._sortSkuName = '';

        /**
         * Group installments by name
         */
        this._installmentGroup = false;

        this._setCustomFilter = null;
    }

    _getInstance(vtexUtils, catalog) {
        this._globalHelpers = vtexUtils.globalHelpers;
        this._vtexHelpers = vtexUtils.vtexHelpers;
        this._catalog = catalog;
    }

    _error(type) {
        throw new Error(CONSTANTS.ERRORS[type]);
    }

    /**
     * Cache Products/SKUs Id
     * @param {Object} product Product to cache
     */
    _setCache(product) {
        const {productId, items} = product;
        this._catalog.productCache[productId] = product;

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
        const self = this;
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
                    self._requestStartEvent();

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

                products.forEach((product) => {
                    product = this._parseCamelize(product);
                    product = this._setPriceInfo(product);
                    product = this._setSortSku(product);
                    product = this._setInstallmentsGroup(product);

                    if ( !this._globalHelpers.isNull(this._setCustomFilter) ) {
                        this._setCustomFilter.apply(this, [product]);
                    }

                    this._setCache(product);
                });

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

            def.resolve(productData);
        }).fail((...err) => def.reject(err));

        return def.promise();
    }

    /**
     * Search products with shelf template
     * @param  {Object} params       Object with search parameters
     * @param  {Object} headers      Request headers
     * @return {Promise}             Promise with search results
     */
    _searchPage(params, headers) {
        const self = this;
        let paramsFormatted = $.extend({}, params);
        let resources = `${this._maxParamsPerRequest}-${(this._maxParamsPerRequest) - 1}`;

        /* eslint-disable */
        const def = $.Deferred();
        /* eslint-enable */

        $.ajax({
            url: '/buscapagina/',
            data: $.param(paramsFormatted, true),
            beforeSend(xhr) {
                self._requestStartEvent();

                for ( let header in headers ) {
                    if ( {}.hasOwnProperty.call(headers, header) ) {
                        xhr.setRequestHeader(header, headers[header]);
                    }
                }
                xhr.setRequestHeader('resources', resources);
            },
        }).then((products) => def.resolve(products));

        return def.promise();
    }

    _searchFacets() {
        const pathname = window.location.pathname;
        const pathQty = globalHelpers.arrayCompact(pathname.split('/')).length;
        let map = '?map=c';

        for ( let i = 0; i < (pathQty - 1); i += 1 ) {
            map += ',c';
        }

        window.console.log(pathQty);
        window.console.log(map);

        /* eslint-disable */
        return $.Deferred((def) => {
            /* eslint-enable */
            return $.ajax({
                url: `${CONSTANTS.FACETS_URL}/${pathname}${map}`,
            }).then((res) => def.resolve(res))
            .fail((err) => def.reject(err));
        }).promise();
    }

    /**
     * Utils
     */
    _setPriceInfo(product) {
        if ( this._priceInfo ) {
            const availableProduct = this._vtexHelpers.getFirstAvailableSku(product);
            product.available = (availableProduct) ? true : false;

            for ( let item in product.items ) {
                if ( {}.hasOwnProperty.call(product.items, item) ) {
                    const sku = product.items[item];
                    const sellerInfo = this._globalHelpers.objectSearch(sku, {'sellerDefault': true});

                    this._globalHelpers.extend(product.items[item], this._vtexHelpers.getProductPriceInfo(sellerInfo));
                }
            }
        }

        return product;
    }

    _parseCamelize(product) {
        if ( this._camelizeItems ) {
            product = this._globalHelpers.camelize(product);

            if ( product.hasOwnProperty('allSpecifications') ) {
                product.allSpecifications = product.allSpecifications.map((item) => this._globalHelpers.camelize(item));
            }

            if ( this._camelizeProps ) {
                for ( let key in product ) {
                    if ( {}.hasOwnProperty.call(product, key) ) {
                        if ( this._globalHelpers.contains(key, this._camelizeProps) ) {
                            if ( this._globalHelpers.isArray(product[key]) ) {
                                product[key] = product[key].map((item, index) => this._globalHelpers.camelize(item));
                            }
                        }
                    }
                }
            }

            product.isCamelized = true;
        }

        return product;
    }

    _setSortSku(product) {
        if ( this._sortSku ) {
            const sorted = this._vtexHelpers.sortProductSearch(product, this._sortSkuItems, this._sortSkuName);
            product.items = sorted;
        }

        return product;
    }

    _setInstallmentsGroup(product) {
        if ( this._installmentGroup ) {
            for ( let item in product.items ) {
                if ( {}.hasOwnProperty.call(product.items, item) ) {
                    const sku = product.items[item];
                    const sellerInfo = this._globalHelpers.objectSearch(sku, {'sellerDefault': true});
                    const groupedInstallments = this._vtexHelpers.getGroupInstallments(sellerInfo); // Uses sellerDefault

                    product.items[item].installmentsGrouped = ( this._globalHelpers.isObjectEmpty(groupedInstallments) ) ? null : groupedInstallments;
                }
            }
        }

        return product;
    }

    /**
     * Request Start Event
     */
    _requestStartEvent() {
        /* eslint-disable */
        const ev = $.Event('requestStart.vtexCatalog');
        /* eslint-enable */

        $(document).trigger(ev);
    }

    /**
     * Request End Events
     *
     * @param  {String} type  Register specific event type
     */
    _requestEndEvent(type) {
        /* eslint-disable */
        const ev = $.Event(`request${type}End.vtexCatalog`);
        /* eslint-enable */

        $(document).trigger(ev);
    }
}

export default Private;
