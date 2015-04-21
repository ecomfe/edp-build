/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file lib/processor/helper.js
 * @author leeight
 */

var util = require('util');
var path = require('path');

var u = require('underscore');
var Q = require('q');
var debug = require('debug')('helper');
var uglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');

var replaceRequireResource = require('../util/replace-require-resource');
var replaceTagAttribute = require('../util/replace-tag-attribute');

exports.replaceRequireResource = function (code, pluginId, resourceReplacer) {
    return replaceRequireResource(code, pluginId, resourceReplacer);
};

exports.replaceTagAttribute = function (content, tag, attribute, valueReplacer, condition) {
    return replaceTagAttribute(content, tag, attribute, valueReplacer, condition);
};

exports.compileHtml2Js = function (html2js, code, options) {
    return html2js(code, options);
};

exports.compileStylus = function (stylus, code, options) {
    var deferred = Q.defer();

    stylus(code)
        .set('filename', options.pathname)
        .set('compress', !!options.compress)
        .set('paths', options.paths)
        .use(function (style) {
            if ('function' === typeof options.use) {
                options.use(style);
            }
        })
        .render(function (err, css) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(css);
            }
        });

    return deferred.promise;
};

exports.compileLess = function (less, code, options) {
    var deferred = Q.defer();

    if (less.version[0] >= 2) { // 2.0.0 and above
        less.render(code, options)
            .then(function (output) {
                deferred.resolve(output.css);
            }, function (error) {
                deferred.reject(error);
            });
    }
    else {
        var parser = new (less.Parser)(options);
        parser.parse(code, function (error, tree) {
            if (error) {
                deferred.reject(error);
                return;
            }
            try {
                deferred.resolve(tree.toCSS({
                    compress: !!options.compress
                }));
            }
            catch (ex) {
                deferred.reject(ex);
            }
        }, options);
    }

    return deferred.promise;
};

exports.ext2files = function (extnames) {
    if (extnames && typeof extnames === 'string') {
        extnames = extnames.split(/\s*,\s*/);
    }

    if (Array.isArray(extnames) && extnames.length) {
        return extnames.map(function (item) {
            return '*.' + item;
        });
    }
};

/**
 * 压缩css代码
 *
 * @param {string} code 源代码
 * @param {Object} options 压缩工具选项
 * @return {string}
 */
exports.compressCss = function (code, options) {
    var clean = new CleanCSS(options);
    return clean.minify(code).styles;
};

/**
 * 压缩Javascript代码
 *
 * @inner
 * @param {FileInfo} file 文件信息对象
 * @param {{mangle:Object,compress:Object,sourceMap:Object}} options 配置信息.
 * @return {Array.<string>}
 */
exports.compressJavascript = function (file, options) {
    prepareOptions(options);
    debug('helper.compressJavascript.options = %j', options);

    var ast = uglifyJS.parse(file.data, {filename: file.path});
    var sourceMap = null;
    var suffix = '';
    if (options.sourceMap.enable) {
        var webRoot = path.relative(path.dirname(file.path), '.');
        sourceMap = new uglifyJS.SourceMap({
            file: path.basename(file.path),
            root: webRoot
        });
        var sourceMappingURL = util.format('%s%s%s',
            (options.sourceMap.host || (webRoot ? (webRoot + '/') : '')),
            (options.sourceMap.root || '') + '/',
            file.path + '.map');
        suffix = '\n//# sourceMappingURL=' + sourceMappingURL;
    }

    ast.figure_out_scope();
    ast = ast.transform(new uglifyJS.Compressor(options.compress));

    // need to figure out scope again so mangler works optimally
    ast.figure_out_scope();
    ast.compute_char_frequency(options.mangle);
    ast.mangle_names(options.mangle);

    var stream = new uglifyJS.OutputStream({
        /*eslint-disable*/
        'source_map': sourceMap
        /*eslint-enable*/
    });
    ast.print(stream);

    return [
        // 压缩之后的代码
        stream.get() + suffix,
        // SourceMap的代码
        sourceMap ? sourceMap.toString() : null
    ];
};

function prepareOptions(options) {
    // default options
    //
    // see http://lisperator.net/uglifyjs/compress about compressOptions
    //
    // mangleOptions has not be seen in offical site, see `except` in
    //      https://github.com/mishoo/UglifyJS2/blob/master/bin/uglifyjs
    // `toplevel` and `defines` can be used is not sure.
    if (options.compress !== false) {
        options.compress = u.extend({
            warnings: false,
            // see https://github.com/ecomfe/edp/issues/230
            conditionals: false
        }, options.compress || {});
    }

    // see http://lisperator.net/uglifyjs/mangle
    if (options.mangle !== false) {
        options.mangle = u.extend({
            except: ['require', 'exports', 'module']
        }, options.mangle || {});
    }

    if (options.sourceMap !== false) {
        options.sourceMap = u.extend({root: 'source_map'}, options.sourceMap);
    }
}










/* vim: set ts=4 sw=4 sts=4 tw=120: */
