var edp = require('edp-core');
var path = require('path');
var AbstractProcessor = require('./abstract');

var replaceMap = {
    'script': '<script type="text/javascript">{::}</script>',
    'link': '<style type="text/css">{::}</style>'
};
/**
 * Output内容的清理处理器
 *
 * @constructor
 * @param {Object} options
 */
function SourceProcessor(options) {
    options = edp.util.mix({
        files: ['*.html']
    }, options);
    AbstractProcessor.call(this, options);
}

/**
 * 获取远程文件
 *
 * @constructor
 * @param {Object} options
 */
function getRemoteUrl(url, callback) {
    var type = /^https/.test(url) ? 'https' : 'http',
        server = require(type);

    server.get(url, function(res) {
        var list = [];
        if (res.statusCode === 404 || res.statusCode === 302) {
            return callback(res.statusCode);
        }
        res.on('data', function(data) {
            list.push(data);
        });
        res.on('end', function() {
            callback(0, Buffer.concat(list) + '');
        });
    }).on('error', function() {
        callback(500);
    });
};

/**
 * 文件映射中读取结果
 *
 * @constructor
 * @param {Object} options
 */
function getFileFromContext(processContext, type, src) {
    var result;

    var mapRec = processContext.files || {};

    if (mapRec[src]) {
        result = mapRec[src];
    } else {
        for (var k in mapRec) {
            var item = mapRec[k];
            if (src == item.outputPath || src == item.path) {
                result = item;
                break;
            }
        }
    }
    if (result) {
        if (replaceMap[type]) {
            return replaceMap[type].replace('{::}', result.data);
        } else {
            return result.data;
        }
    }
}


SourceProcessor.prototype = new AbstractProcessor();

/**
 * @type {string}
 */
SourceProcessor.prototype.name = 'SourceProcessor';

/**
 * 构建处理
 *
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
SourceProcessor.prototype.process = function(file, processContext, callback) {
    var data = file.data;
    var reg = /\<(link|script|include).*?data\-combined(=[\"\'](.*?)[\"\'])?.*?\>.*?(\<\/(script|include)>)?/g;
    var srcReg = /(src|href)=[\"\'](.*?)[\"\']/i;

    data = data.replace(reg, function(match, type, _, src) {
        if (!src || /^(on|true|yes)$/i.test(src)) {
            src = srcReg.exec(match)[2];
        }
        return getFileFromContext(processContext, type, src) || '';
    });
    file.setData(data);
    callback();
};

module.exports = exports = SourceProcessor;