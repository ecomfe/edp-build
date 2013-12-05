/**
 * 返回使用manifest页面资源的url
 * 
 * @inner
 * @param {string} content 使用manifest页面的内容
 * @return {object} 页面使用css的href数组 script的src数组 require的id数组
 */
module.exports = exports = function ( content ) {

    var linkTagList = [];
    var scriptTagList = [];
    var requireJsList = [];
    var replaceTagAttribute = require( './replace-tag-attribute' );
    var requireJsMatch = content.match( /require\s*\(\s*\[([^\]]*)\]/g ) || [];
    var readModuleId = require( './read-module-id' );
    function getId( matchList ) {
        var list = [];
        matchList.forEach( function ( content ) {
            Array.prototype.push.apply( list , readModuleId( content ) );
        });
        return list;
    }

    requireJsList = getId( requireJsMatch );

    replaceTagAttribute( content, 'link', 'href', function ( href ) {
        linkTagList.push( href );
    } );

    replaceTagAttribute( content, 'script', 'src', function ( src ) {
        scriptTagList.push( src );
    } );

    return {
        linkTagList: linkTagList || [],
        scriptTagList: scriptTagList || [],
        requireJsList: requireJsList || []
    };
};


