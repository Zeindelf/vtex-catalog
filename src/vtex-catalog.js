
import CONSTANTS from './vtex-catalog.constants.js';
import vtexCatalogMethods from './vtex-catalog.methods.js';

/**
 * Create a VtexCatalog class
 * Vtex utilities methods
 */
class VtexCatalog {
    constructor(vtexUtils, catalogCache = false) {
        /**
         * Version
         * @type {String}
         */
        this.version = '0.9.0';

        /**
         * Package name
         * @type {String}
         */
        this.name = '@VtexCatalog';

        // Validate Vtex Utils
        if ( vtexUtils === undefined ) {
            throw new TypeError(CONSTANTS.MESSAGES.vtexUtils);
        }

        if ( vtexUtils.name !== '@VtexUtils' ) {
            throw new TypeError(CONSTANTS.MESSAGES.vtexUtils);
        }

        if ( vtexUtils.version < CONSTANTS.MESSAGES.vtexUtilsVersion ) {
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
    }
}

export default VtexCatalog;
