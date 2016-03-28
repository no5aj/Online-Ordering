/*
 * Revel Systems Online Ordering Application
 *
 *  Copyright (C) 2014 by Revel Systems
 *
 * This file is part of Revel Systems Online Ordering open source application.
 *
 * Revel Systems Online Ordering open source application is free software: you
 * can redistribute it and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Revel Systems Online Ordering open source application is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Revel Systems Online Ordering Application.
 * If not, see <http://www.gnu.org/licenses/>.
 */

define([], function() {
    'use strict';

    /**
     * Used tax codes.
     * @type {object}
     */
    App.TaxCodes = {
            TAX_COUNTRY_USA: 'usa',
            TAX_COUNTRY_AU: 'au',
            TAX_COUNTRY_CA: 'ca',
            TAX_COUNTRY_CA_ON: 'ca_on',
            TAX_COUNTRY_UK: 'uk',
            TAX_COUNTRY_OTHER_INCLUDED: 'other_tax_included',
            /**
             * Checks if tax and surcharge are included in subtotal.
             * @method
             * @type {function}
             * @param   {string}  tax_country - country code.
             * @returns {boolean}
             * - true, if tax is included for `tax_country`;
             * - false otherwise.
             */
            is_tax_included: function(tax_country) {
                if (!tax_country) {
                    return false;
                }
                return App.TaxCodes.TAX_COUNTRIES_WITH_TAX_INCLUDED.indexOf(tax_country.toLowerCase()) !== -1;
            }
        };
        App.TaxCodes.TAX_COUNTRY_DEFAULT = App.TaxCodes.TAX_COUNTRY_USA;
        App.TaxCodes.TAX_COUNTRIES_WITH_TAX_INCLUDED = [
            App.TaxCodes.TAX_COUNTRY_AU,
            App.TaxCodes.TAX_COUNTRY_UK,
            App.TaxCodes.TAX_COUNTRY_OTHER_INCLUDED
        ];
});