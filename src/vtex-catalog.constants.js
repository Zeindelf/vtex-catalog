
const vtexUtilsVersion = '0.9.5';

export default {
    SEARCH_URL: '/api/catalog_system/pub/products/search/',
    PRODUCT_CACHE_NAME: '__vtexCatalog.productCache__',
    SKU_CACHE_NAME: '__vtexCatalog.skuCache__',
    EXPIRE_TIME: 60 * 60 * 4, // Seconds * Minutes * Hours (default: 4h)
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
    },
    MESSAGES: {
        vtexUtils: 'VtexUtils.js is required and must be an instance. Download it from https://www.npmjs.com/package/vtex-utils and use "new VtexCatalog(new VtexUtils())"',
        vtexUtilsVersion: vtexUtilsVersion,
        vtexUtilsVersionMessage: `VtexUtils version must be higher than ${vtexUtilsVersion}. Download last version on https://www.npmjs.com/package/vtex-utils`,
    },
};
