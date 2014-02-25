(function () {

    function Walker() {
    }

    if (window.define && typeof window.define == 'function') {
        define(Walker);
    }
    else {
        window.walker = Walker;
    }
}());

conso.log('do something ...');

define(function () {
    return {};
});
