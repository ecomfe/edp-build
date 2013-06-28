
/**
 * 替换Loader配置信息
 * 
 * @param {Object} configData 新的配置信息数据
 * @param {Object} info 原配置数据信息对象，通常为readLoaderConfig的返回值
 * @return {string}
 */
module.exports = exports = function ( configData, info ) {
    var code = require( 'escodegen' ).generate(
        require( 'esprima' ).parse( '(' + JSON.stringify( configData ) + ')' ),
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
