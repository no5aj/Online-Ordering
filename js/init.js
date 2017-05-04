    function MainSpinner() {
	}

    // show spinner when App is initializing and init jquery `spinner` plugin
    MainSpinner.prototype.initSpinner = function() {
        var nodes = document.querySelectorAll('html, body');
        var i = 0;
        for (; i < nodes.length; i++) {
            nodes[i].style.width = '100%';
            nodes[i].style.height = '100%';
            nodes[i].style.margin = '0';
        }

        document.querySelector('body').innerHTML = '<div class="ui-loader-default" style="width: 100%; height: 100%; font-size:' + MainSpinner.getFontSize() + 'px !important" id="loader"></div>';
        var loader = document.querySelector('#loader');
        MainSpinner.addSpinner.call(loader);
        loader.style.cssText += "background-color: rgba(170, 170, 170, .8); position: absolute;";

        if (/stanford=true/.test(window.location.search)) {
            document.querySelector('.ui-spinner').classList.add("stanford");
        }

        return loader;
    }
   /**
     * Appends a spinner to html element. 'this' keyword value should be an HTMLElement instance.
     * @memberof module:app
     * @type {Function}
     * @static
     * @example
     * // load 'app' module and add spinner to `body` element
     * require(['app'], function('app') {
     *     app.addSpinnder.call(document.body);
     * });
     */
    //implemented as static method:
    MainSpinner.addSpinner = function() {
        var html = '<div class="ui-spinner animate-spin"></div>';
        if('absolute' !== this.style.position) {
            this.style.position = 'relative';
        }
        this.innerHTML += html;
    }

    /**
     * Calculates a font size based on client size. This value affects CSS sizes in `em` units.
     * @memberof module:app
     * @type {Function}
     * @static
     * @example
     * // load 'app' module and set a font size to `body` element
     * require(['app'], function('app') {
     *     var fontSize = app.getFontSize(document.body);
     *     document.body.style.fontSize = fontSize + 'px';
     * });
     * @returns {number} base font size
     */
    // define font-size for spinner
    MainSpinner.getFontSize = function() {
        var wCoef = document.documentElement.clientWidth / 640,
            hCoef = document.documentElement.clientHeight / 700,
            baseSize = 12;

        if (wCoef > hCoef)
            return Math.round(hCoef * baseSize * 1.5);
        else
            return Math.round(wCoef * baseSize * 1.5);
    }