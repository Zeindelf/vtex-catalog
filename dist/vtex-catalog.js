
/*!!
 * VtexCatalog.js v0.0.1
 * https://github.com/zeindelf/vtex-catalog
 *
 * Copyright (c) 2017-2018 Zeindelf
 * Released under the MIT license
 *
 * Date: 2018-02-18T17:14:16.302Z
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VTEX = global.VTEX || {}, global.VTEX.VtexCatalog = factory());
}(this, (function () { 'use strict';

var vtexUtilsVersion = '0.9.0';

var CONSTANTS = {
    SEARCH_URL: '/api/catalog_system/pub/products/search/',
    PRODUCT_CACHE_NAME: '__vtexCatalog.productCache__',
    SKU_CACHE_NAME: '__vtexCatalog.skuCache__',
    EXPIRE_TIME: 60 * 60 * 4, // Seconds * Minutes * Hours (default: 4h)
    ERRORS: {
        searchParamsNotDefined: 'Search parameters is not defined.',
        searchParamsNotAnObject: 'Search parameters is not a valid Object.',
        searchRangeNotArray: '\'range\' is not an Array',
        productIdNotDefined: 'Product ID is not defined.',
        skuIdNotDefined: 'Sku ID is not defined.',
        productIdArrayNotAnArray: '\'productIdArray\' is not an Array.',
        skuIdArrayNotAnArray: '\'skuIdArray\' is not an Array.',
        productIdArrayNotDefined: '\'productIdArray\' is not an defined.',
        skuIdArrayNotDefined: '\'skuIdArray\' is not an defined.',
        fqPropertyNotFound: 'The property \'fq\' was not found.',
        itemsIdNotDefined: '\'itemsId\' is not defined.',
        itemsIdNotAnArray: '\'itemsId\' is not an Array.',
        searchItemsNotDefined: 'Search items is not defined. Use \'fq\' or \'ft\' to search.',
        shelfIdNotDefined: '\'shelfId\' is not defined.',
        shelfIdNotAString: '\'shelfId\' is not a String.'
    },
    MESSAGES: {
        vtexUtils: 'VtexUtils.js is required and must be an instance. Download it from https://www.npmjs.com/package/vtex-utils and use "new VtexCatalog(new VtexUtils())"',
        vtexUtilsVersion: vtexUtilsVersion,
        vtexUtilsVersionMessage: 'VtexUtils version must be higher than ' + vtexUtilsVersion + '. Download last version on https://www.npmjs.com/package/vtex-utils'
    }
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var Private = function () {
    function Private() {
        classCallCheck(this, Private);

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

    createClass(Private, [{
        key: '_getInstance',
        value: function _getInstance(vtexUtils, catalog) {
            this._globalHelpers = vtexUtils.globalHelpers;
            this._catalog = catalog;

            this._storage = vtexUtils.storage;
            this._session = this._storage.session;
        }
    }, {
        key: '_error',
        value: function _error(type) {
            throw new Error(CONSTANTS.ERRORS[type]);
        }
    }, {
        key: '_setSessionCache',
        value: function _setSessionCache(catalogCache) {
            this._catalogCache = catalogCache;
            this._initStorage();
        }

        /**
         * Init and validate Session Store Cache
         * @return {Void}
         */

    }, {
        key: '_initStorage',
        value: function _initStorage() {
            if (this._globalHelpers.isNull(this._session.get(CONSTANTS.PRODUCT_CACHE_NAME))) {
                this._session.set(CONSTANTS.PRODUCT_CACHE_NAME, {});
            }

            if (this._globalHelpers.isNull(this._session.get(CONSTANTS.SKU_CACHE_NAME))) {
                this._session.set(CONSTANTS.SKU_CACHE_NAME, {});
            }
        }

        /**
         * Store products into Session Storage
         */

    }, {
        key: '_setProductCache',
        value: function _setProductCache(products) {
            if (this._catalogCache) {
                var productCache = this._session.get(CONSTANTS.PRODUCT_CACHE_NAME);

                for (var id in products) {
                    if (!productCache.hasOwnProperty(id)) {
                        productCache[id] = products[id];
                    }
                }

                this._session.set(CONSTANTS.PRODUCT_CACHE_NAME, productCache, CONSTANTS.EXPIRE_TIME);
            }
        }

        /**
         * Store SKUs ID into Session Storage
         */

    }, {
        key: '_setSkuCache',
        value: function _setSkuCache(productsId) {
            if (this._catalogCache) {
                var productIdCache = this._session.get(CONSTANTS.SKU_CACHE_NAME);

                for (var id in productsId) {
                    if (!productIdCache.hasOwnProperty(id)) {
                        productIdCache[id] = productsId[id];
                    }
                }

                this._session.set(CONSTANTS.SKU_CACHE_NAME, productIdCache, CONSTANTS.EXPIRE_TIME);
            }
        }
    }, {
        key: '_getProductCache',
        value: function _getProductCache() {
            return this._catalogCache ? this._session.get(CONSTANTS.PRODUCT_CACHE_NAME) : this._catalog.productCache;
        }
    }, {
        key: '_getSkuCache',
        value: function _getSkuCache() {
            return this._catalogCache ? this._session.get(CONSTANTS.SKU_CACHE_NAME) : this._catalog.skusProductIds;
        }

        /**
         * Cache Products/SKUs Id
         * @param {Object} product Product to cache
         */

    }, {
        key: '_setCache',
        value: function _setCache(product) {
            var _this = this;

            var productId = product.productId,
                items = product.items;

            this._catalog.productCache[productId] = product;

            if (this._catalogCache) {
                this._setProductCache(this._catalog.productCache);
            }

            items.forEach(function (item) {
                var itemId = item.itemId;

                _this._catalog.skusProductIds[itemId] = productId;
            });
        }

        /**
         * Search products in Catalog
         * @param  {Object} params       Object with search parameters. Valid params: C:/{a}/{b} (Category), fq=specificationFilter_{a}:{b} (Filter), fq=P:[{a} TO {b}] (Price)
         * @param  {Object} [headers={}] Request headers
         * @return {Promise}             Promise with search results
         */

    }, {
        key: '_search',
        value: function _search(params) {
            var _this2 = this,
                _$;

            var headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var paramsFormatted = $.extend({}, params);
            var xhrArray = this._pendingFetchArray;
            var productData = [];

            for (var queryType in params) {
                if (queryType === 'map') {
                    continue;
                }

                // Loop each query and filter the ones that are already fetched
                // or are pending
                paramsFormatted[queryType] = params[queryType].filter(function (query) {
                    // Check if query was already fetched and the response was empty
                    if (~_this2._emptyFetchedParams.indexOf(query)) {
                        return false;
                    }

                    // NOTE: Two step validation, the first IF statement checks if the query
                    // was already gotten and if the query is still pending
                    if (~_this2._fetchedParams.indexOf(query)) {
                        return false;
                    } else {
                        if (!~_this2._pendingParamsToFetch.indexOf(query)) {
                            _this2._pendingParamsToFetch.push(query);
                            return true;
                        } else {
                            return false;
                        }
                    }
                });
            }

            var paramsLength = 1;

            // If params fq is an array get the length
            if (this._globalHelpers.isArray(params.fq)) {
                paramsLength = paramsFormatted.fq.length;
            }

            var requestAmount = Math.ceil(paramsLength / this._maxParamsPerRequest);

            // Loop for each requestAmount

            var _loop = function _loop(i) {
                var resources = i * _this2._maxParamsPerRequest + '-' + ((i + 1) * _this2._maxParamsPerRequest - 1);

                /* eslint-disable */
                var searchRequest = $.Deferred();
                /* eslint-enable */

                $.ajax({
                    url: CONSTANTS.SEARCH_URL,
                    data: $.param(paramsFormatted, true),
                    beforeSend: function beforeSend(xhr) {
                        for (var header in headers) {
                            if ({}.hasOwnProperty.call(headers, header)) {
                                xhr.setRequestHeader(header, headers[header]);
                            }
                        }
                        xhr.setRequestHeader('resources', resources);
                    },
                    success: function success(products) {
                        searchRequest.resolve(products);
                    }
                });

                xhrArray.push(searchRequest.promise());
            };

            for (var i = 0; i < requestAmount; i += 1) {
                _loop(i);
            }

            /* eslint-disable */
            var def = $.Deferred();
            /* eslint-enable */

            (_$ = $).when.apply(_$, toConsumableArray(xhrArray)).done(function () {
                for (var _len = arguments.length, requests = Array(_len), _key = 0; _key < _len; _key++) {
                    requests[_key] = arguments[_key];
                }

                requests.forEach(function (request, index) {
                    var products = request;
                    products.forEach(function (product) {
                        return _this2._setCache(product);
                    });

                    // Remove resolved fetch from array
                    xhrArray.splice(index, 1);
                });

                for (var _queryType in params) {
                    if ({}.hasOwnProperty.call(params, _queryType)) {
                        params[_queryType].forEach(function (query) {
                            var _query$split = query.split(':'),
                                _query$split2 = slicedToArray(_query$split, 2),
                                queryField = _query$split2[0],
                                queryValue = _query$split2[1];

                            var product = void 0;

                            // Add fetched params
                            _this2._fetchedParams.push(query);

                            switch (queryField) {
                                case 'skuId':
                                    {
                                        var productId = _this2._catalog.skusProductIds[queryValue];
                                        product = _this2._catalog.productCache[productId];
                                        break;
                                    }
                                case 'productId':
                                    {
                                        product = _this2._catalog.productCache[queryValue];
                                        break;
                                    }
                            }

                            if (_this2._globalHelpers.isUndefined(product)) {
                                _this2._emptyFetchedParams.push(query);
                            } else {
                                productData.push(product);
                            }
                        });
                    }
                }

                if (productData.length) {
                    _this2._setSkuCache(_this2._catalog.skusProductIds);

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

    }, {
        key: '_searchPage',
        value: function _searchPage(params, headers) {
            var paramsFormatted = $.extend({}, params);
            var resources = this._maxParamsPerRequest + '-' + (this._maxParamsPerRequest - 1);

            /* eslint-disable */
            var def = $.Deferred();
            /* eslint-enable */

            $.ajax({
                url: '/buscapagina/',
                data: $.param(paramsFormatted, true),
                beforeSend: function beforeSend(xhr) {
                    for (var header in headers) {
                        if ({}.hasOwnProperty.call(headers, header)) {
                            xhr.setRequestHeader(header, headers[header]);
                        }
                    }
                    xhr.setRequestHeader('resources', resources);
                }
            }).then(function (products) {
                def.resolve(products);
            });

            return def.promise();
        }

        /**
         * Request End Events
         * @param  {String} type  Register specific event type
         */

    }, {
        key: '_requestEndEvent',
        value: function _requestEndEvent(type) {
            /* eslint-disable */
            var ev = $.Event('request' + type + 'End.vtexCatalog');
            /* eslint-enable */

            setTimeout(function () {
                $(document).trigger(ev);
            }, 0);
        }
    }]);
    return Private;
}();

var _private = new Private();

var vtexCatalogMethods = {
    /**
     * Sets Catalog instance
     * @return {Void}
     */
    _setInstance: function _setInstance(vtexUtils, catalogCache) {
        _private._getInstance(vtexUtils, this);
        _private._setSessionCache(catalogCache);
    },
    getProductCache: function getProductCache() {
        return _private._getProductCache();
    },
    getSkusProductId: function getSkusProductId() {
        return _private._getSkuCache();
    },


    /**
     * Search by product ID
     * @param  {Number} productId ID of the product to search
     * @return {Promise}                    Promise with search results
     */
    searchProduct: function searchProduct(productId) {
        if (this.globalHelpers.isUndefined(productId)) {
            return _private._error('productIdNotDefined');
        }

        /* eslint-disable */
        var def = $.Deferred();
        /* eslint-enable */

        var _productCache = _private._getProductCache();

        if (_productCache[productId]) {
            def.resolve(_productCache[productId]);
        } else {
            var params = {
                fq: ['productId:' + productId]
            };

            var search = _private._search(params);

            // Since it should be only 1 item set index is 0
            search.done(function (products) {
                return def.resolve(products[0]);
            });
        }

        def.then(function () {
            return _private._requestEndEvent('Product');
        });

        return def.promise();
    },


    /**
     * Search by sku ID
     * Sku methods stores in
     * @param  {Number} skuId ID of the sku to search
     * @return {Promise}            Promise with search results
     */
    searchSku: function searchSku(skuId) {
        if (this.globalHelpers.isUndefined(skuId)) {
            return _private._error('skuIdNotDefined');
        }

        /* eslint-disable */
        var def = $.Deferred();
        /* eslint-enable */

        var _productCache = _private._getProductCache();
        var _skuCache = _private._getSkuCache();

        if (_skuCache[skuId]) {
            def.resolve(_productCache[_skuCache[skuId]]);
        } else {
            var params = {
                fq: ['skuId:' + skuId]
            };

            var search = _private._search(params);

            // Since it should be only 1 item set index is 0
            search.done(function (products) {
                return def.resolve(products[0]);
            });
        }

        def.then(function () {
            return _private._requestEndEvent('Sku');
        });

        return def.promise();
    },


    /**
     * Search by product ID array
     * @param  {Array} productIdArray Array IDs of the prodcuts to search
     * @return {Promise}                            Promise with search results
     */
    searchProductArray: function searchProductArray(productIdArray) {
        if (this.globalHelpers.isUndefined(productIdArray)) {
            return _private._error('productIdArrayNotDefined');
        }

        if (!this.globalHelpers.isArray(productIdArray)) {
            return _private._error('productIdArrayNotAnArray');
        }

        /* eslint-disable */
        var def = $.Deferred();
        /* eslint-enable */

        var productData = {};
        var params = { fq: [] };
        var _productCache = _private._getProductCache();

        for (var i = 0, len = productIdArray.length; i < len; i += 1) {
            if (this.globalHelpers.isUndefined(_productCache[productIdArray[i]])) {
                params.fq.push('productId:' + productIdArray[i]);
            } else {
                productData[productIdArray[i]] = _productCache[productIdArray[i]];
            }
        }

        if (params.fq.length) {
            var search = _private._search(params);

            search.done(function (products) {
                for (var _i = 0, _len = products.length; _i < _len; _i += 1) {
                    productData[products[_i].productId] = products[_i];
                }

                def.resolve(productData);
            });
        } else {
            def.resolve(productData);
        }

        def.then(function () {
            return _private._requestEndEvent('ProductArray');
        });

        return def.promise();
    },


    /**
     * Search by sku ID array
     * @param  {Array} skuIdArray Array IDs of the skus to search
     * @return {Promise}                    Promise with search results
     */
    searchSkuArray: function searchSkuArray(skuIdArray) {
        if (this.globalHelpers.isUndefined(skuIdArray)) {
            return _private._error('skuIdArrayNotDefined');
        }

        if (!this.globalHelpers.isArray(skuIdArray)) {
            return _private._error('skuIdArrayNotAnArray');
        }

        /* eslint-disable */
        var def = $.Deferred();
        /* eslint-enable */

        var productData = {};
        var params = { fq: [] };
        var _productCache = _private._getProductCache();
        var _skuCache = _private._getSkuCache();

        for (var i = 0, len = skuIdArray.length; i < len; i += 1) {
            if (!_skuCache[skuIdArray[i]]) {
                params.fq.push('skuId:' + skuIdArray[i]);
            } else {
                var productId = _skuCache[skuIdArray[i]];
                productData[productId] = _productCache[productId];
            }
        }

        if (params.fq.length) {
            var search = _private._search(params);

            search.done(function (products) {
                for (var _i2 = 0, _len2 = products.length; _i2 < _len2; _i2 += 1) {
                    productData[products[_i2].productId] = products[_i2];
                }

                def.resolve(productData);
            });
        } else {
            def.resolve(productData);
        }

        def.then(function () {
            return _private._requestEndEvent('SkuArray');
        });

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
    searchDefault: function searchDefault(params) {
        var range = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        if (this.globalHelpers.isUndefined(params)) {
            return _private._error('searchParamsNotDefined');
        }

        if (!this.globalHelpers.isObject(params)) {
            return _private._error('searchParamsNotAnObject');
        }

        if (this.globalHelpers.isUndefined(params.fq)) {
            return _private._error('fqPropertyNotFound');
        }

        if (!this.globalHelpers.isArray(range)) {
            return _private._error('searchRangeNotArray');
        }

        var mapParam = { map: [] };

        // Loop each parameter
        for (var i = 0, len = params.fq.length; i < len; i += 1) {
            var param = params.fq[i];

            // If param is the category one
            if (param.match('C:')) {
                // Generate a 'c' param in the 'mapParam' for each category
                var categoryIds = param.split('/');

                for (var z = 0, _len3 = categoryIds.length; z < _len3; z += 1) {
                    // If the 'categoryId' is a number
                    if (categoryIds[z].match(/\d.+/gi)) {
                        mapParam.map.push('c');
                    }
                }
            }

            // If param is priceFrom
            if (param.match(/P\[.+[\d\w\s]?\]/g)) {
                mapParam.map.push('priceFrom');
            }
        }

        // Join mapParam map to generate a string and push it into the params object
        mapParam.map = mapParam.map.join(',');
        var rangeParam = {
            _from: (range[0] < 1 ? 1 : range[0]) || 1,
            _to: (range[1] > 50 ? 50 : range[1]) || 50
        };

        // Join params and mapParam
        $.extend(params, mapParam, rangeParam);

        /* eslint-disable */
        var def = $.Deferred();
        /* eslint-enable */

        $.ajax({
            url: CONSTANTS.SEARCH_URL,
            data: $.param(params, true),
            beforeSend: function beforeSend(xhr) {
                xhr.setRequestHeader('resources', '0-49');
            }
        }).done(function () {
            return def.resolve.apply(def, arguments);
        }).fail(function (err) {
            return def.reject(err);
        });

        def.then(function () {
            return _private._requestEndEvent('SearchDefault');
        });

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
    searchPage: function searchPage(searchParams) {
        var splitList = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        if (this.globalHelpers.isUndefined(searchParams)) {
            return _private._error('searchParamsNotDefined');
        }

        if (!this.globalHelpers.isPlainObject(searchParams)) {
            return _private._error('searchParamsNotAnObject');
        }

        if (!searchParams.hasOwnProperty('fq') && !searchParams.hasOwnProperty('ft')) {
            return _private._error('searchItemsNotDefined');
        }

        if (this.globalHelpers.isUndefined(searchParams.shelfId)) {
            return _private._error('shelfIdNotDefined');
        }

        if (!this.globalHelpers.isString(searchParams.shelfId)) {
            return _private._error('shelfIdNotAString');
        }

        /* eslint-disable */
        var def = $.Deferred();
        /* eslint-enable */

        var conditionalParams = {};
        var defaultParams = {
            sl: searchParams.shelfId,
            cc: searchParams.columns || 100,
            sm: searchParams.sm || 0,
            O: searchParams.order || '',
            PageNumber: 1
        };

        if (searchParams.hasOwnProperty('fq')) {
            conditionalParams = {
                fq: [],
                ps: searchParams.quantity || this.globalHelpers.length(searchParams.fq)
            };

            for (var i = 0, len = searchParams.fq.length; i < len; i += 1) {
                conditionalParams.fq.push('productId:' + searchParams.fq[i]);
            }
        }

        if (searchParams.hasOwnProperty('ft')) {
            conditionalParams = {
                ft: searchParams.ft,
                ps: searchParams.quantity || 10
            };
        }

        var params = $.extend({}, conditionalParams, defaultParams);
        var search = _private._searchPage(params, headers);
        search.done(function (result) {
            if (splitList) {
                var $productsList = $(result).find('li[layout=' + searchParams.shelfId + ']');

                def.resolve($productsList);
            } else {
                def.resolve(result);
            }
        }).fail(function (err) {
            return def.reject(err);
        });

        def.then(function () {
            return _private._requestEndEvent('SearchPage');
        });

        return def.promise();
    }
};

var VtexCatalog = function VtexCatalog(vtexUtils) {
  var catalogCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  classCallCheck(this, VtexCatalog);

  /**
   * Version
   * @type {String}
   */
  this.version = '0.5.0';

  /**
   * Package name
   * @type {String}
   */
  this.name = '@VtexCatalog';

  // Validate Vtex Utils
  if (vtexUtils === undefined) {
    throw new TypeError(CONSTANTS.MESSAGES.vtexUtils);
  }

  if (vtexUtils.name !== '@VtexUtils') {
    throw new TypeError(CONSTANTS.MESSAGES.vtexUtils);
  }

  if (vtexUtils.version < CONSTANTS.MESSAGES.vtexUtilsVersion) {
    throw new Error(CONSTANTS.MESSAGES.vtexUtilsVersionMessage);
  }

  /**
   * Global Helpers instance
   * @type {GlobalHelpers}
   */
  this.globalHelpers = vtexUtils.globalHelpers;

  /**
   * Vtex Helpers instance
   * @type {VtexHelpers}
   */
  this.vtexHelpers = vtexUtils.vtexHelpers;

  /**
   * Local/Session Storage
   * @type {Object}
   */
  this.storage = vtexUtils.storage;

  /**
   * Object with data of the products searched
   * @type {Object}
   */
  this.productCache = {};

  /**
   * Sku ID map to productId
   * To avoid looping the products in cache in order to find the
   * needed sku, use this object to store the product ID of each sku ID
   * @type {Object}
   */
  this.skusProductIds = {};

  /**
   * Extend public methods
   * @type {Method}
   */
  this.globalHelpers.extend(VtexCatalog.prototype, vtexCatalogMethods);

  /**
   * Sets instance for private Methods
   * @type {Method}
   */
  this._setInstance(vtexUtils, catalogCache);
};

return VtexCatalog;

})));
