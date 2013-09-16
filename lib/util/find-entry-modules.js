
var estraverse = require( 'estraverse' );
var SYNTAX = estraverse.Syntax;
var LITERAL_REQUIRE = 'require';


/**
 * html片段中查询script标签的innerText
 * 
 * @inner
 * @param {string} content html片段内容
 * @return {Array.<string>} 每个标签一个数组项
 */
function findScriptTexts( content ) {
    // script标签就算有属性，属性值里总不会带有“>”吧
    var segs = content.split( /<script[^>]*>/ );
    var texts = [];
    for ( var i = 1; i < segs.length; i++ ) {
        texts.push( segs[ i ].split( /<\/script>/ )[ 0 ] );
    }

    return texts;
};

/**
 * 从内容中寻找入口模块
 * 
 * @param {string} content 查找内容源
 * @param {string} contentType 内容类型，js|html
 * @return {Array}
 */
module.exports = exports = function ( content, contentType ) {
    var mods = [];
    var modsCache = {};

    if ( contentType === 'js' ) {
        findFromJsCode( content ); 
    }
    else {
        findScriptTexts( content ).forEach( 
            function ( text ) {
                findFromJsCode( text );
            }
        );
    }

    return mods;

    /**
     * 从Javascript代码中寻找入口模块
     * 
     * @inner
     * @param {string} content 查找内容源
     * @param {string} contentType 内容类型，js|html
     * @return {Array}
     */
    function findFromJsCode( code ) {
        var ast;
        try {
            ast = require( 'esprima' ).parse( code );
        }
        catch ( ex ) {
            return;
        }
        
        estraverse.traverse(
            ast,
            {
                enter: function ( node ) {
                    var arrayArg;
                    if ( node.type === SYNTAX.CallExpression 
                        && node.callee.name === LITERAL_REQUIRE
                        && ( arrayArg = node.arguments[ 0 ] )
                        && arrayArg.type === SYNTAX.ArrayExpression
                    ) {
                        arrayArg.elements.forEach( function ( item ) {
                            var value;
                            if ( item.type === SYNTAX.Literal 
                                && ( value = item.value )
                                && typeof value === 'string' 
                                && !modsCache[ value ]
                            ) {
                                mods.push( value );
                                modsCache[ value ] = 1;
                            }
                        } );
                    }
                }
            }
        );
    }
};
