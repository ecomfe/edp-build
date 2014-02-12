/**
 * 判断url是否本地路径
 *
 * @param {string} url 路径
 * @return {boolean}
 */
module.exports = exports = function( url ) {
    // url("//www.baidu.com/img/logo.gif")
    // url("http://www.baidu.com/img/logo.gif")
    // url("https://www.baidu.com/img/logo.gif")
    return !( /^\/\//.test( url ) || /^[a-z]{2,10}:/i.test( url ) );

};
