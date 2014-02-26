(function () {

    function Walker() {
    }

    if (window.define && typeof window.define == 'function') {
        define('walker', Walker);
    }
    else {
        window.walker = Walker;
    }

}());

conso.log('do something ...');

define('module', ['foo', 'bar'], function () {
    return {};
});
