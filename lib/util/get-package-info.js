
/**
 * 获取模块id所属的package信息
 * 
 * @param {string} moduleId 模块id
 * @param {string} moduleConfigFile 模块配置文件
 * @return {Object}
 */
module.exports = exports = function ( moduleId, moduleConfigFile ) {
    var moduleConfig = require( './read-json-file' )( moduleConfigFile );
    var packages = moduleConfig.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];
        var pkgName = pkg.name;
        var pkgMain = pkg.main || 'main';

        if ( moduleId === pkgName ) {
            return {
                name     : pkgName,
                location : pkg.location,
                main     : pkgMain,
                module   : pkgName + '/' + pkgMain
            };
        }
    }

    return null;
};
