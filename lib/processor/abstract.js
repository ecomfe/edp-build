/**
 * @file 构建处理器抽象类
 * @author errorrik[errorrik@gmail.com]
 */

var edp = require( 'edp-core' );

/**
 * 构建处理器抽象类
 * 
 * @abstract
 * @constructor
 * @param {Object} options 初始化参数
 */
function AbstractProcessor( options ) {
    for ( var key in options ) {
        this[ key ] = options[ key ];
    }
    this.log = edp.log;
}


/**
 * 判断处理器是否忽略文件
 * 
 * @param {FileInfo} file 文件信息对象
 */
AbstractProcessor.prototype.isExclude = function ( file ) {
    var satisfy = false;
    var excludes = this.exclude instanceof Array
        ? this.exclude
        : [];

    excludes.forEach( 
        function ( path ) {
            satisfy = satisfy || edp.path.satisfy( file.path, path, file.stat );
        }
    );

    return satisfy;
};

/**
 * 判断处理器是否包含文件。包含文件的优先级大于忽略文件
 * 
 * @param {FileInfo} file 文件信息对象
 */
AbstractProcessor.prototype.isInclude = function ( file ) {
    var satisfy = false;
    var includes = this.include instanceof Array
        ? this.include
        : [];

    includes.forEach( 
        function ( path ) {
            satisfy = satisfy || edp.path.satisfy( file.path, path, file.stat );
        }
    );

    return satisfy;
};

/**
 * 构建处理入口
 * 
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.start = function ( processContext, callback ) {
    var processor = this;
    var start = Date.now();
    this.beforeAll( processContext );

    var dots = ( require( 'os' ).platform() === 'darwin' ) ? '⋅⋅⋅' : '...';

    var me = this;
    this._beforeLog = '  (' + (Date.now() - start ) + 'ms) ' + dots + ' ';
    edp.log.write( this._beforeLog );

    this.processAll( processContext, finishProcessAll );

    function finishProcessAll() {
        if ( processor.afterAll !== AbstractProcessor.prototype.afterAll ) {
            start = Date.now();
            processor.afterAll( processContext );
            edp.log.write( '%s ' + dots + ' (%sms)', me._doneLog, Date.now() - start );
        }

        callback();
    }
};

/**
 * 构建处理前的行为，选择要处理的文件
 * 
 * @param {ProcessContext} processContext 构建环境对象
 */
AbstractProcessor.prototype.beforeAll = function ( processContext ) {
    var processor = this;
    this.processFiles = Array.isArray( this.files )
        ? processContext.getFilesByPatterns( this.files )
        : processContext.getFiles().filter(
            function ( file ) {
                // processor处理文件
                // 如果一个文件属于exclude，并且不属于include，则跳过处理
                if ( typeof processor.isExclude === 'function' 
                    && processor.isExclude( file ) 
                    && ( typeof processor.isInclude !== 'function' 
                          || !processor.isInclude( file )
                        )
                ) {
                    return false;
                }

                return true;
            }
        );
};

/**
 * 处理后所有文件
 * 
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.processAll = function ( processContext, callback ) {
    var files = this.processFiles;
    var fileIndex = 0;
    var fileCount = files.length;
    var processor = this;
    var processStart = Date.now();

    var me = this;
    var beforeLog = this._beforeLog;

    nextFile();
    function nextFile() {
        if ( fileIndex >= fileCount ) {
            me._doneLog = require( 'util' ).format( '%s[%s/%s]: %s (%sms)',
                beforeLog, fileCount, fileCount, 'Process done',
                Date.now() - processStart );
            edp.log.write( me._doneLog );
            callback();
            return;
        }

        var file = files[ fileIndex++ ];
        var start = Date.now();

        // processor处理需要保证异步性，否则可能因为深层次的层级调用产生不期望的结果
        // 比如错误被n次调用前的try捕获到
        function processFinished() { 
            edp.log.write('%s[%s/%s]: %s (%sms)', beforeLog, fileIndex, fileCount, file.path,
                Date.now() - start );
            setTimeout( nextFile, 1 );
        }

        processor.process(
            file, 
            processContext, 
            processFinished
        );
    }
};


/**
 * 构建处理后的行为，默认啥都不干，特别的processor可以复写这个方法
 * 
 * @virtual
 * @param {ProcessContext} processContext 构建环境对象
 */
AbstractProcessor.prototype.afterAll = function ( processContext ) {};

/**
 * 构建处理单个文件
 * 
 * @virtual
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
AbstractProcessor.prototype.process = function ( 
    file, 
    processContext, 
    callback 
) {
    // do nothing in abstract class
    callback();
};

module.exports = exports = AbstractProcessor;
