
const vtexUtilsVersion = '1.17.0';

export default {
    SEARCH_URL: '/api/catalog_system/pub/products/search/',
    FACETS_URL: '/api/catalog_system/pub/facets/search/',
    ERRORS: {
        searchParamsNotDefined: `Search parameters is not defined.`,
        searchParamsNotAnObject: `Search parameters is not a valid Object.`,
        searchRangeNotArray: `'range' is not an Array`,
        productIdNotDefined: `Product ID is not defined.`,
        skuIdNotDefined: `Sku ID is not defined.`,
        productIdArrayNotAnArray: `'productIdArray' is not an Array.`,
        skuIdArrayNotAnArray: `'skuIdArray' is not an Array.`,
        productIdArrayNotDefined: `'productIdArray' is not an defined.`,
        skuIdArrayNotDefined: `'skuIdArray' is not an defined.`,
        fqPropertyNotFound: `The property 'fq' was not found.`,
        itemsIdNotDefined: `'itemsId' is not defined.`,
        itemsIdNotAnArray: `'itemsId' is not an Array.`,
        searchItemsNotDefined: `Search items is not defined. Use 'fq' or 'ft' to search.`,
        shelfIdNotDefined: `'shelfId' is not defined.`,
        shelfIdNotAString: `'shelfId' is not a String.`,
        callbackNotAFunction: `'callback' must be a Function`,
    },
    MESSAGES: {
        vtexUtils: 'VtexUtils.js is required and must be an instance. Download it from https://www.npmjs.com/package/vtex-utils and use "new VtexCatalog(new VtexUtils())"',
        vtexUtilsVersion: vtexUtilsVersion,
        vtexUtilsVersionMessage: `'VtexUtils.js' version must be ${vtexUtilsVersion} or higher. Download last version on https://www.npmjs.com/package/vtex-utils`,
    },
};
