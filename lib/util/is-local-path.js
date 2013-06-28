/**
 * 判断url是否本地路径
 *
 * @param {string} url 路径
 * @return {boolean}
 */
module.exports = exports = function( url ) {
    return !/^[a-z]{2,10}:/i.test( url );
};
