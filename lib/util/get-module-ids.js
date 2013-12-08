
/**
 * 从内容中读取module id数组
 * 
 * @param {string} content 内容
 * @return {array}
 */
module.exports = exports = function ( content ) {
    
    var requireJsMatch = content.match( /require\s*\(\s*\[([^\]]*)\]/g ) || [];
    var result = [];

    function getId( matchList ) {
        var list = [];
        matchList.forEach( function ( content ) {
            Array.prototype.push.apply( list , readModuleId( content ).data );
        });
        return list;
    }

    result = getId( requireJsMatch );
    return result;

};

function readModuleId( content ) {
    var outputInfo = {};
    var index = content.search( /(require\s*\(\s*\[)/ );
    if ( index < 0 ) {
        return;
    }

    index += RegExp.$1.length - 1;

    // 取文件内容
    outputInfo.content = content;

    // 查找require module id的开始和结束位置
    var len = content.length;
    var braceLevel = 0;
    outputInfo.fromIndex = index;
    do {
        switch ( content[ index ] ) {
            case '[': 
                braceLevel++;
                break;
            case ']':
                braceLevel--;
                break;
        }

        index++;
    } while ( braceLevel && index < len );
    outputInfo.toIndex = index;

    // 取配置数据
    content = content.slice( outputInfo.fromIndex, index );
    outputInfo.data = eval( '(' + content + ')' );

    return outputInfo;
}
