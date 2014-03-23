define('moment/moment', function(){
    (function (undefined) {
        define('moment', [], function () {
            return {};
        });
    }.call(this));
});

define('moment', ['moment/moment'], function ( main ) { return main; });

(function (root) {
    var etpl = {};
    define('etpl/main', etpl);
}(this));

define('etpl', ['etpl/main'], function ( main ) { return main; });
