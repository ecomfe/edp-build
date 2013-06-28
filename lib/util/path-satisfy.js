
/**
 * 判断路径片段是否满足规则
 * 
 * @inner
 * @param {string} pathTerm 路径片段
 * @param {string} patternTerm 规则片段
 * @return {boolean} 
 */
function pathTermSatisfy( pathTerm, patternTerm ) {
    var negate = false;
    if ( patternTerm.indexOf( '!' ) === 0 ) {
        negate = true;
        patternTerm = patternTerm.slice( 1 );
    }

    var pattern = new RegExp( 
        '^'
        + patternTerm
            .replace( /\./g, '\\.' )
            .replace( /\*/g, '.*' )
            .replace( /\?/g, '.' )
        + '$'
    );

    var isMatch = pattern.test( pathTerm );
    negate && ( isMatch = !isMatch );
    return isMatch;
}


/**
 * 判断路径是否满足规则
 * 
 * @param {string} path 源路径
 * @param {string} pattern 路径规则
 * @param {fs.Stats=} fileStat 路径所代表的文件状态对象
 * @return {boolean}
 */
module.exports = exports = function ( path, pattern, fileStat ) {
    // If the pattern ends with a “/”
    // it would only find a match with a directory
    if ( pattern.lastIndexOf( '/' ) === pattern.length - 1 ) {
        pattern = pattern.slice( 0, pattern.length - 1 );
        if ( fileStat && (!fileStat.isDirectory()) ) {
            return false;
        }
    }

    // A leading “/” matches the beginning of the pathname
    var matchBeginning = false;
    if ( pattern.indexOf( '/' ) === 0 ) {
        matchBeginning = true;
        pattern = pattern.slice( 1 );
    }

    // Satisfy terms one by one
    var pathTerms = path.split( '/' );
    var patternTerms = pattern.split( '/' );
    var patternLen = patternTerms.length;
    var pathLen = pathTerms.length;
    while ( patternLen-- ) {
        pathLen--;

        if ( pathLen < 0 
            || (!pathTermSatisfy( 
                    pathTerms[ pathLen ], 
                    patternTerms[ patternLen ] 
                )) 
        ) {
            return false;
        }
    }

    // match path beginning
    if ( matchBeginning && pathLen !== 0 ) {
        return false;
    }

    return true;
};
