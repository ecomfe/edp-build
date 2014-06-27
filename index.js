/**
 * @file 构建功能主模块
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us]
 */

var fs = require( 'fs' );
var ProcessorBase = require( './lib/processor/abstract' );
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
            AbstractProcessor   : ProcessorBase,
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
            StringReplace       : require( './lib/processor/string-replace' ),
            BcsUploader         : require( './lib/processor/bcs-uploader' ),
            OutputCleaner       : require( './lib/processor/output-cleaner' )
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
    if ( !Array.isArray( processors ) ) {
        if ( conf.stage in processors ) {
            // 返回的是对象，key应该是stage的值
            processors = processors[ conf.stage ];
        }
        else {
            edp.log.error( 'Invalid stage value, candidates are = %s',
                JSON.stringify( Object.keys( processors ) ) );
            callback();
            return;
        }
    }

    var processContext = new ProcessContext( {
        baseDir: baseDir,
        exclude: exclude,
        outputDir: outputDir,
        fileEncodings: fileEncodings
    } );


    var start = Date.now();
    traverseDir( [baseDir].concat( conf.inputs || [] ), processContext );
    edp.log.info( 'Scan build root directory (%sms)', Date.now() - start );

    var processorIndex = 0;
    var processorCount = processors.length;

    function nextProcess() {
        if ( processorIndex >= processorCount ) {
            outputFiles();
            return;
        }

        var processor = processors[ processorIndex++ ];
        if ( !(processor instanceof ProcessorBase) ) {
            processor = new ProcessorBase( processor );
        }

        edp.log.info( 'Running ' + processor.name );
        if ( processor.start ) {
            processor.start( processContext, nextProcess );
        }
        else {
            nextProcess();
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

        require( './lib/util/pingback' )(function(){
            edp.log.info( 'All done (%sms)', Date.now() - start );
            callback();
        });
    }
}

module.exports = exports = main;

exports.getDefaultConfig = function () {
    return require( './lib/config' );
};


