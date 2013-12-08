/**
 * 返回manifest文件的初始内容
 * 
 * @return {array} 返回manifest文件的初始内容
 */
module.exports = exports = function () {
    
    var TPL = [
        'CACHE MANIFEST',
        '# version  #{version}',
        'CACHE:',
        '# html files',
        '#{html}',
        '# css files',
        '#{css}',
        '# images files',
        '#{image}',
        '# js files',
        '#{js}',
        '# custom',
        '#{custom}',
        'FALLBACK:',
        '#{fallback}',
        'NETWORK:',
        '*',
        '#{network}'
    ].join( '\n' );

    return TPL;
};
