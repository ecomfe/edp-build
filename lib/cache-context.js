/**
 * @file 缓存上下文
 * @author wuhuiyao (sparklewhy@gmail.com)
 */

var fs = require('fs');
var edp = require('edp-core');
var u = require('underscore');
var mkdirp = require('mkdirp');
var FileInfo = require('./file-info');

/**
 * 包装下处理器
 *
 * @param {Object} processor 处理器实例
 * @param {CacheContext} cacheContext 缓存上下文实例
 */
function wrapProcessor(processor, cacheContext) {
    var rawStart = processor.start;
    processor.start = function (processContext, callback) {
        cacheContext.loadManifest(processContext);
        rawStart.apply(this, arguments);
    };

    var rawBeforeAll = processor.beforeAll;
    processor.beforeAll = function () {
        rawBeforeAll.apply(this, arguments);

        var processFiles = this.processFiles;
        for (var i = processFiles.length - 1; i >= 0; i--) {
            var file = processFiles[i];

            cacheContext.addSourceFile(file);

            if (u.isFunction(processor.hasChanged)
                    ? !processor.hasChanged(file, cacheContext)
                    : !cacheContext.hasChanged(file)
            ) {
                processFiles.splice(i, 1);
                cacheContext.toUseCacheFiles.push(file);
            }
            else {
                edp.log.info('file %s content change', file.path);
                cacheContext.toRemoveFiles.push(file);
            }
        }
    };

    var rawAfterAll = processor.afterAll;
    processor.afterAll = function () {
        cacheContext.toUseCacheFiles.forEach(function (file) {
            cacheContext.initCacheProcessResult(file);
        });
        cacheContext.updateCache();
        rawAfterAll.apply(this, arguments);
    };
}

/**
 * 创建缓存上下文实例
 *
 * @param {Object} processor 处理器实例
 * @param {Object=} options 缓存选项
 * @constructor
 */
function CacheContext(processor, options) {
    this.processor = processor;
    this.cacheDir = processor.name.toLowerCase();
    u.extend(this, this.constructor.DEFAULT_OPTIONS, options);

    this.sourceFiles = [];
    this.toUseCacheFiles = [];
    this.toRemoveFiles = [];
    wrapProcessor(processor, this);
}

/**
 * 默认选项定义
 *
 * @type {Object}
 */
CacheContext.DEFAULT_OPTIONS = {

    /**
     * 缓存的根目录
     *
     * @type {string}
     */
    baseDir: '.edpproj'
};

/**
 * 获取给定的文件路径的 md5
 *
 * @param {string} path 文件路径
 * @return {?string}
 */
CacheContext.prototype.getMD5 = function (path) {
    return (this.manifest[path] || {}).md5;
};

/**
 * 获取给定的文件的依赖文件信息
 *
 * @param {string} path 文件路径
 * @return {Array.<Object>}
 */
CacheContext.prototype.getFileDeps = function (path) {
    return (this.manifest[path] || {}).deps || [];
};

/**
 * 初始化文件的缓存的处理结果
 *
 * @param {Object} file 要初始化的文件
 */
CacheContext.prototype.initCacheProcessResult = function (file) {
    var cacheInfo = this.manifest[file.path];
    if (!cacheInfo) {
        edp.log.fatal(
            '%s cache information is changed unexpected, please delete cache '
            + 'result manually and execute edp build again!', file.path
        );
        return;
    }

    file.outputPath = cacheInfo.outputPath;
    file.outputPaths = cacheInfo.outputPaths;
    file.data = this.readCacheContent(file.path);
    this.processContext.addFile(file);
};

/**
 * 读取缓存的文件内容
 *
 * @param {string} path 缓存文件路径
 * @return {?Buffer}
 */
CacheContext.prototype.readCacheContent = function (path) {
    if (!path) {
        return;
    }

    var cachePath = edp.path.resolve(this.cacheTarget, path);
    try {
        var fileData = new FileInfo({
            data: fs.readFileSync(cachePath),
            extname: edp.path.extname(path).slice(1),
            path: path,
            fullPath: path
        });
        return fileData.data;
    }
    catch (ex) {
        edp.log.fatal(
            'Read processor %s cache file %s fail!',
            this.processor.name, cachePath
        );
    }
};

/**
 * 添加源文件信息
 *
 * @param {Object} file 要添加的源文件
 */
CacheContext.prototype.addSourceFile = function (file) {
    var analyzeDeps = this.processor.analyzeDependence;
    var deps = (u.isFunction(analyzeDeps)
        && analyzeDeps.call(this.processor, file)) || [];
    this.sourceFiles.push({
        file: file,
        md5: file.md5sum(),
        dep: deps
    });
};

/**
 * 判断给定的文件是否发生变化
 *
 * @param {Object} file 要判断的文件
 * @return {boolean}
 */
CacheContext.prototype.hasChanged = function (file) {
    if (this.getMD5(file.path) !== file.md5sum()) {
        return true;
    }

    var deps = this.getFileDeps(file.path);
    var processContext = this.processContext;
    return deps.some(function (item) {
        var depFile = processContext.getFileByPath(item.path);
        return !depFile || depFile.md5sum() !== item.md5;
    });
};

/**
 * 更新缓存的信息
 */
CacheContext.prototype.updateCache = function () {
    edp.log.info(
        'cache processor %s process result information...', this.processor.name
    );

    // remove changed cache files
    var me = this;
    var hasUpdate;
    u.isEmpty(me.manifest) || this.toRemoveFiles.forEach(function (file) {
        hasUpdate = true;

        var path = edp.path.resolve(me.cacheTarget, file.path);
        try {
            fs.unlinkSync(path);
        }
        catch (ex) {
            edp.log.fatal('remove cache file %s fail!', path);
        }
    });

    // cache files
    this.processor.processFiles.forEach(function (file) {
        hasUpdate = true;

        var outputFile = edp.path.resolve(me.cacheTarget, file.path);
        try {
            mkdirp.sync(edp.path.dirname(outputFile));
            fs.writeFileSync(outputFile, file.getDataBuffer());
        }
        catch (ex) {
            edp.log.fatal('cache process file %s fail!', outputFile);
        }
    });

    hasUpdate && this.serializeManifiest();
};

/**
 * 反序列化缓存清单信息
 *
 * @param {Object} data 要反序列化数据
 * @return {Object}
 */
CacheContext.prototype.deserializeManifiest = function (data) {
    Object.keys(data).forEach(function (path) {
        var info = data[path];
        var outputPaths = info.out.split(',');
        info.outputPath = outputPaths[0];
        info.outputPaths = outputPaths.slice(1);

        var deps = info.deps || [];
        info.deps = deps.map(function (item) {
            var infos = item.split(',');
            return {
                path: infos[0],
                md5: infos[1]
            };
        });
    });

    return data;
};

/**
 * 序列化缓存清单信息
 *
 * @param {Object} data 要反序列化数据
 */
CacheContext.prototype.serializeManifiest = function () {
    var sourceFiles = this.sourceFiles;
    var sourceMap = {};
    sourceFiles.forEach(function (item) {
        var file = item.file;
        var result = {md5: item.md5};

        var deps = (item.deps || []).map(function (dep) {
            return dep.path + ',' + dep.md5;
        });
        deps.length && (result.deps = deps);

        var outs = [];
        outs.push(file.outputPath || '');
        outs.push.apply(outs, file.outputPaths || []);
        result.out = outs.join(',');

        sourceMap[file.path] = result;
    });

    fs.writeFileSync(
        this.manifestPath, JSON.stringify(sourceMap, null, 4), 'UTF-8'
    );
};

/**
 * 加载缓存信息
 *
 * @param {Object} processContext 当前处理上下文
 */
CacheContext.prototype.loadManifest = function (processContext) {
    edp.log.info(
        'load processor %s cache manifest information...', this.processor.name
    );

    this.processContext = processContext;
    this.processBase = processContext.baseDir;
    this.cacheTarget = edp.path.resolve(
        this.processBase, this.baseDir, this.cacheDir
    );

    // 读取缓存清单信息
    try {
        this.manifestPath = this.cacheTarget + '.json';
        this.manifest = this.deserializeManifiest(
            edp.util.readJSONFile(this.manifestPath)
        );
    }
    catch (ex) {
        this.manifest = {};
    }
};

module.exports = exports = CacheContext;
