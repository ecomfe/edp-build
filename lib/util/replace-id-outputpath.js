/**
 * 根据模块id，返回发布路径
 * 
 * @param {string} id 内容
 * @param {object} confData 配置文件json对象
 * @return {string} outpuPath 发布路径
 */
var path = require( './path');
module.exports = exports = function ( id, confData ) {

    var outputPath = path.join( confData.baseUrl, id );
    
    var paths = confData.paths || {};
    for ( var key in paths ) {
        if ( id === key) {
            outputPath = outputPath.replace( key, paths[ key ] );
        }
    }

    var packages = confData.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];

        if ( id === pkg.name && typeof pkg === 'object' && pkg.location ) {
            outputPath = outputPath.replace( id , pkg.location );
            outputPath += '/' + pkg.main;
        }
    }

    if( outputPath.indexOf( '.js' ) == -1 ) {
        outputPath += '.js';
    }
    return outputPath;
};
