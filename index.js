/**
 * @file 构建功能主模块
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us]
 */

var fs = require( 'fs' );
var path = require( './lib/util/path' );
var pathSatisfy = require( './lib/util/path-satisfy' );
var ProcessContext = require( './lib/process-context' );
var FileInfo = require( './lib/file-info' );


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

        file = path.resolve( dir, file );
        var stat = fs.statSync( file );

        // if exclude, do nothing
        var relativePath = path.relative( processContext.baseDir, file );
        var isExclude = false;
        processContext.exclude.some( function ( excludeFile ) {
            if ( pathSatisfy( relativePath, excludeFile, stat ) ) {
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
                if ( pathSatisfy( relativePath, encodingPath ) ) {
                    fileEncoding = fileEncodings[ encodingPath ];
                    break;
                }
            }

            var fileData = new FileInfo( {
                data         : fs.readFileSync( file ),
                extname      : path.extname( file ).slice( 1 ),
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
 * 获取构建过程的处理器
 * 
 * @inner
 * @param {Array} processorOptions 处理器选项
 * @return {Array}
 */
function getProcessors( processorOptions ) {
    processorOptions = processorOptions || [];
    var processors = [];

    processorOptions.forEach( function ( option ) {
        if ( !option.name ) {
            return;
        }

        var Constructor = require( './processor/' + option.name );
        var processor = new Constructor( option );
        processor._name_ = option.name;
        processors.push( processor );
    } );

    return processors;
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
            VariableSubstitution: require( './lib/processor/variable-substitution' )
        } );
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
            outputFiles();
            return;
        }

        var processor = processors[ processorIndex++ ];
        var files = processContext.getFiles();
        var fileIndex = 0;
        var fileCount = files.length;

        nextFile();

        function nextFile() {
            if ( fileIndex >= fileCount ) {
                nextProcess();
                return;
            }

            var file = files[ fileIndex++ ];
            
            // processor处理需要保证异步性，否则可能因为深层次的层级调用产生不期望的结果
            // 比如错误被n次调用前的try捕获到
            function processFinished() { 
                setTimeout( nextFile, 1 );
            }

            // processor处理文件
            // 如果一个文件属于exclude，并且不属于include，则跳过处理
            if ( typeof processor.isExclude === 'function' 
                 && processor.isExclude( file ) 
                 && ( typeof processor.isInclude !== 'function' 
                      || !processor.isInclude( file )
                    )
            ) {
                processFinished();
            }
            else {
                console.log( '[edp build] process ' + file.path 
                    + ', use ' + processor.name );

                processor.process( 
                    file, 
                    processContext, 
                    processFinished
                );
            }
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
                    var outputFile = path.resolve( outputDir, outputPath );
                    mkdirp.sync( path.dirname( outputFile ) );
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


