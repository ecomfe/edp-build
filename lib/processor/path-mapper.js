/**
 * @file 路径映射的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */
var edp = require( 'edp-core' );
var array = require( '../util/array' );
var AbstractProcessor = require( './abstract' );

/**
 * 路径映射的构建处理器
 *
 * @constructor
 * @param {Object} options 初始化参数
 * @param {function} options.mapper from和to的自定义处理函数.
 * @param {string} options.from 原路径前缀片段
 * @param {string|function} options.to 替换的目标路径片段
 * @param {Array} options.replacements 需要替换的对象列表
 */
function PathMapper( options ) {
    this.files = [ '**/*' ];
    var pageFiles = [
        '*.html',
        '*.htm',
        '*.phtml',
        '*.tpl',
        '*.vm'
    ];

    // 默认的配置
    options = edp.util.mix( {
        replacements: [
            { type: 'html', tag: 'link', attribute: 'href', files: pageFiles },
            { type: 'html', tag: 'img', attribute: 'src', files: pageFiles },
            { type: 'html', tag: 'script', attribute: 'src', files: pageFiles },
            { type: 'html', tag: 'a', attribute: 'href', files: pageFiles },
            { type: 'html', tag: 'embed', attribute: 'src', files: pageFiles },
            { type: 'html', tag: 'param', attribute: 'value', files: pageFiles,
                condition: function ( tagSource ) {
                    return /\sname=['"]movie['"]/.test( tagSource );
                }
            },
            { replacer: 'module-config', files: pageFiles.slice(0).concat( ['*.js'] ) },
            { replacer: 'inline-css', files: pageFiles },
            { replacer: 'css', files: ['*.css', '*.less'] }
        ],
        from: 'src',
        to: 'asset'
    }, options );
    AbstractProcessor.call( this, options );

    // 用户自定义的配置
    var from = this.from = new RegExp( '(^|/)' + this.from + '(/|$)' );
    var to = this.to = function ( match, head, tail ) {
        return (head === '/' ? head : '')
            + options.to
            + (tail === '/' ? tail : '');
    };

    if (typeof this.mapper !== 'function') {
        this.mapper = function(value) {
            return value.replace( from, to );
        };
    }

    var mapper = this.mapper;
    /**
     * 值替换函数
     *
     * @param {string} value 原始值
     * @return {string}
     */
    this.valueReplacer = function ( value ) {
        if ( !value ) {
            return '';
        }

        if ( !edp.path.isLocalPath( value ) ) {
            return value;
        }

        return mapper(value);
    };
}

PathMapper.prototype = new AbstractProcessor();

/**
 * 处理器名称
 *
 * @type {string}
 */
PathMapper.prototype.name = 'PathMapper';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
PathMapper.prototype.process = function ( file, processContext, callback ) {
    var valueReplacer = this.valueReplacer;
    // 替换文件路径
    if ( file.outputPath ) {
        file.outputPath = valueReplacer( file.outputPath );
        file.outputPaths = file.outputPaths.map( function ( outputPath ) {
            return valueReplacer( outputPath );
        } );
    }
    callback();
};

PathMapper.prototype.afterAll = function ( processContext ) {
    var builtinReplacers = this.replacers;
    var valueReplacer = this.valueReplacer;

    // 替换对象进行处理，替换文件内容
    // replacement替换有两种模式：
    // 1. 指定了type，使用固定逻辑替换
    // 2. 指定replacer，使用内置的replacer函数替换
    //
    // 2的灵活性更强。
    //
    // 1现在仅支持html tag的attribute替换
    // 2现在仅支持`module-config`替换
    // 1和2现在都是内置逻辑，原因是希望build配置是纯json。未来可能开放。
    this.replacements.forEach(
        function ( replacement ) {
            var files = replacement.files;
            if ( !files ) {
                var extnames = replacement.extnames;
                if ( extnames ) {
                    if ( !Array.isArray( extnames ) ) {
                        extnames = extnames.split( /\s*,\s*/ );
                    }

                    files = array.list2pattern( extnames );
                }
            }

            var replaceFiles = processContext.getFilesByPatterns( files );
            replaceFiles.forEach( function ( file ) {

                var data = file.data;
                var type = replacement.type;
                var replacer = replacement.replacer;

                if ( replacer ) {
                    data = builtinReplacers[ replacer ](
                        valueReplacer, data, file );
                }
                else {
                    if ( type === 'html' ) {
                        data = require( '../util/replace-tag-attribute' )(
                            data,
                            replacement.tag,
                            replacement.attribute,
                            valueReplacer,
                            replacement.condition
                        );
                    }
                }

                file.setData( data );
            });
        }
    );

};

/**
 * 内置的替换方法
 *
 * @namespace
 */
PathMapper.prototype.replacers = {
    /**
     * 替换css中引用的资源路径.
     *
     * @param {function(string)} valueReplacer 值替换函数
     * @param {string} data 文件数据
     * @param {FileInfo} file 文件信息对象
     * @return {string}
     */
    'css': function (valueReplacer, data, file) {
        var pattern = /\burl\s*\((["']?)([^\)]+)\1\)/g;
        return data.replace(pattern, function(match, startQuote, url){
            var newUrl = valueReplacer(url);
            if (edp.path.isLocalPath(newUrl)) {
                // 把路径归一化一下，例如
                // ././../../ui/img/../img/logo.gif => ../../ui/img/logo.gif
                newUrl = edp.path.normalize(newUrl);
            }
            return require('util').format('url(%s%s%s)',
                startQuote, newUrl, startQuote);
        });
    },

    /**
     * 替换html代码中内联的css中的资源路径.
     *
     * @param {function(string)} valueReplacer 值替换函数
     * @param {string} data 文件数据
     * @param {FileInfo} file 文件信息对象
     * @return {string}
     */
    'inline-css': function(valueReplacer, data, file) {
        var chunks = data.split(/(<\/?style[^>]*>)/i);
        for (var i = 0, l = chunks.length; i < l; i ++) {
            if (/^<style\s+/i.test(chunks[i]) && (i + 1) < l) {
                // 如果遇到了'<style '开头的内容，说明下面的部分是样式的代码了
                chunks[i + 1] = PathMapper.prototype.replacers['css'](
                    valueReplacer, chunks[i + 1], file);
            }
        }

        return chunks.join('');
    },

    /**
     * 模块配置路径替换
     *
     * @param {function(string)} valueReplacer 值替换函数
     * @param {string} data 文件数据
     * @param {FileInfo} file 文件信息对象
     * @return {string}
     */
    'module-config': function ( valueReplacer, data, file ) {
        var readLoaderConfig = require( '../util/read-loader-config' );
        var confInfo = readLoaderConfig( data );
        if ( !confInfo ) {
            return data;
        }

        var confData = confInfo.data;

        confData.baseUrl = valueReplacer( confData.baseUrl );
        var paths = confData.paths || {};
        for ( var key in paths ) {
            paths[ key ] = valueReplacer( paths[ key ] );
        }

        var packages = confData.packages || [];
        for ( var i = 0; i < packages.length; i++ ) {
            var pkg = packages[ i ];
            if ( typeof pkg === 'object' && pkg.location ) {
                pkg.location = valueReplacer( pkg.location );
            }
        }

        var replaceLoaderConfig = require( '../util/replace-loader-config' );
        return replaceLoaderConfig( confData, confInfo );
    }
};

module.exports = exports = PathMapper;
