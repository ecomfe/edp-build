var edp = require( 'edp-core' );

/**
 * 替换Loader配置信息
 * 
 * @param {Object} configData 新的配置信息数据
 * @param {Object} info 原配置数据信息对象，通常为readLoaderConfig的返回值
 * @return {string}
 */
module.exports = exports = function ( configData, info ) {
    var ast = edp.amd.getAst( '(' + JSON.stringify( configData ) + ')' );
    var code = require( 'escodegen' ).generate(
        ast,
        {
            format: {
                escapeless:true,
                indent: {
                    style: '    ',
                    base: info.indentBase
                }
            }
        }
    );

    return info.content.slice( 0, info.fromIndex ) 
        + code.replace( /(^\s*\(|\);$)/g, '' ) 
        + info.content.slice( info.toIndex ); 
};
