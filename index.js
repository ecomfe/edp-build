/**
 * @file 构建功能主模块
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us]
 */

var fs = require( 'fs' );
var ProcessContext = require( './lib/process-context' );
var FileInfo = require( './lib/file-info' );
var edp = require( 'edp-core' );


/**
 * 遍历目录
 * 
 * @inner
 * @param {string|Array.<string>} dir 目录路径
 * @param {ProcessContext} processContext 构建环境对象
 */
function traverseDir( dir, processContext ) {
    if ( Array.isArray(dir) ) {
        dir.forEach( function (item) {
            traverseDir( item, processContext );
        });
        return;
    }

    var files = fs.readdirSync( dir );

    files.forEach( function ( file ) {
        if ( file === '.svn' || file === '.git' ) {
            return;
        }

        file = edp.path.resolve( dir, file );
        var stat = fs.statSync( file );

        // if exclude, do nothing
        var relativePath = edp.path.relative( processContext.baseDir, file );
        var isExclude = false;
        processContext.exclude.some( function ( excludeFile ) {
            if ( edp.path.satisfy( relativePath, excludeFile, stat ) ) {
                isExclude = true;
                return true;
            }
        });
        if ( isExclude ) {
            return;
        }

        if ( stat.isDirectory() ) {
            traverseDir( file, processContext );
        }
        else {
            var fileEncodings = processContext.fileEncodings;
            var fileEncoding = null;
            for ( var encodingPath in fileEncodings ) {
                if ( edp.path.satisfy( relativePath, encodingPath ) ) {
                    fileEncoding = fileEncodings[ encodingPath ];
                    break;
                }
            }

            var fileData = new FileInfo( {
                data         : fs.readFileSync( file ),
                extname      : edp.path.extname( file ).slice( 1 ),
                path         : relativePath,
                fullPath     : file,
                stat         : stat,
                fileEncoding : fileEncoding
            } );
            processContext.addFile( fileData );
        }
    });
}


/**
 * 向配置模块里注入构建处理器
 * 
 * @inner
 * @param {Object} conf 配置模块
 */
function injectProcessor( conf ) {
    if ( conf && conf.injectProcessor ) {
        conf.injectProcessor( {
            AbstractProcessor   : require( './lib/processor/abstract' ),
            MD5Renamer          : require( './lib/processor/md5-renamer' ),
            Html2JsCompiler     : require( './lib/processor/html2js-compiler' ),
            StylusCompiler      : require( './lib/processor/stylus-compiler' ),
            JsCompressor        : require( './lib/processor/js-compressor' ),
            CssCompressor       : require( './lib/processor/css-compressor' ),
            LessCompiler        : require( './lib/processor/less-compiler' ),
            PathMapper          : require( './lib/processor/path-mapper' ),
            ModuleCompiler      : require( './lib/processor/module-compiler' ),
            VariableSubstitution: require( './lib/processor/variable-substitution' ),
            ManifestCompiler    : require( './lib/processor/manifest-compiler' ),
            AddCopyright        : require( './lib/processor/add-copyright' ),
            ReplaceDebug        : require( './lib/processor/replace-debug' ),
            TplMerge            : require( './lib/processor/tpl-merge' ),
            StringReplaceProcessor : require( './lib/processor/string-replace-processor' )
        } );
    }
}

/**
 * 如果是普通的对象，那么转化为AbstractProcessor类型
 * @param {AbstractProcessor} processor 要检查的processor类型.
 */
function patchProcessor(processor) {
    var AbstractProcessor = require( './lib/processor/abstract' );
    if (processor instanceof AbstractProcessor) {
        return processor;
    }
    else {
        // 普通的对象(Plain Object)
        var propertiesObject = {};
        for (var key in processor) {
            propertiesObject[key] = {
                value: processor[key]
            }
        }
        propertiesObject.log = { value: edp.log };
        return Object.create(AbstractProcessor.prototype, propertiesObject);
    }
}

/**
 * 处理构建入口
 * 
 * @param {Object} conf 构建功能配置模块
 * @param {Function=} callback 构建完成的回调函数
 */
function main( conf, callback ) {
    callback = callback || new Function();

    // 构建过程：
    // 1. 输入：自动遍历读取所有构建目录下文件，区分（文本/二进制）
    // 2. 使用conf.getProcessors获取processors
    // 3. 处理：processors对每个已读取的文件进行处理
    // 4. 输出：统一对处理结果进行输出，区分（文本/二进制）
    var exclude = conf.exclude || [];
    var baseDir = conf.input;
    var outputDir = conf.output;
    var fileEncodings = conf.fileEncodings || {};

    injectProcessor( conf );

    var processors = conf.getProcessors();
    if ( Array.isArray( processors ) ) {
        // 返回的是数组的情况，默认值
        processors = processors.map(patchProcessor);
    }
    else if ( conf.stage in processors ) {
        // 返回的是对象，key应该是stage的值
        processors = processors[ conf.stage ];
        processors = processors.map( patchProcessor );
    }
    else {
        edp.log.error( 'Invalid stage value, candidates are = %s',
            JSON.stringify( Object.keys( processors ) ) );
        callback();
        return;
    }

    var processContext = new ProcessContext( {
        baseDir: baseDir,
        exclude: exclude,
        outputDir: outputDir,
        fileEncodings: fileEncodings
    } );


    traverseDir( [baseDir].concat( conf.inputs || [] ), processContext );

    var processorIndex = 0;
    var processorCount = processors.length;

    function nextProcess() {
        if ( processorIndex >= processorCount ) {
            console.log();
            outputFiles();
            return;
        }

        var processor = processors[ processorIndex++ ];
        var files = processContext.getFiles();

        if ( Array.isArray( processor.files  ) ) {
            files = edp.glob.filter( processor.files, files, function( pattern, item ){
                return edp.path.satisfy( item.path, pattern );
            } );
        }
        else {
            files = files.filter(function(file){
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
            });
        }

        var fileIndex = 0;
        var fileCount = files.length;
        edp.log.info('Running ' + processor.name);

        nextFile();

        function nextFile() {
            if ( fileIndex >= fileCount ) {
                if ( typeof processor.done === 'function' ) {
                    processor.done(processContext);
                }

                nextProcess();
                return;
            }

            var file = files[ fileIndex++ ];

            // processor处理需要保证异步性，否则可能因为深层次的层级调用产生不期望的结果
            // 比如错误被n次调用前的try捕获到
            function processFinished() { 
                setTimeout( nextFile, 1 );
            }

            edp.log.write('  [%s/%s]: %s', fileIndex, fileCount, file.path);

            processor.process(
                file, 
                processContext, 
                processFinished
            );
        }
    }

    nextProcess();

    function outputFiles() {
        var mkdirp = require( 'mkdirp' );
        processContext.getFiles().forEach( function ( file ) {
            if ( file.outputPath ) {
                var fileBuffer = file.getDataBuffer();

                file.outputPaths.push( file.outputPath );
                file.outputPaths.forEach( function ( outputPath ) {
                    var outputFile = edp.path.resolve( outputDir, outputPath );
                    mkdirp.sync( edp.path.dirname( outputFile ) );
                    fs.writeFileSync( outputFile, fileBuffer );
                } );
            }
        } );

        callback();
    }
}

module.exports = exports = main;

exports.getDefaultConfig = function () {
    return require( './lib/config' );
};


