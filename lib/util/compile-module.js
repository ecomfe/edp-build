

/**
 * 生成package主模块的代理模块代码
 * 
 * @inner
 * @param {Object} packageInfo package信息对象
 * @return {string} 
 */
function getPackageMainCode( packageInfo ) {
    var id = packageInfo.name;
    var mod = packageInfo.module;
    return 'define(\'' + id + '\', [\'' + mod 
        + '\'], function ( main ) { return main; });'
}

/**
 * 编译模块
 * 
 * @param {string} code 模块代码
 * @param {string} moduleId 模块id
 * @param {string} moduleConfig 模块配置文件
 * @param {boolean|Object=} combine 合并依赖编译选项
 * @param {Object=} excludeModules 如果合并依赖，需要一个对象指定不需要合并的模块
 * @return {string} 
 */
function compileModule(code, moduleId, moduleConfig, combine, excludeModules) {
    // 根据语法树分析模块
    var ast;
    try {
        ast = require( 'esprima' ).parse( code );
    }
    catch ( ex ) {
        return false;
    }

    var moduleInfo = require( './analyse-module' )( ast );
    if ( !moduleInfo || moduleInfo instanceof Array ) {
        return false;
    }

    // 附加模块id
    var pkgInfo;
    if ( !moduleInfo.id ) {
        moduleInfo.id = moduleId;
        pkgInfo = require( './get-package-info' )( moduleId, moduleConfig );
    }
    moduleId = moduleInfo.id;


    // 模块代码数组容器
    var codes = [];


    // 初始化合并模式时排除模块列表
    // 内建模块先被排除
    excludeModules = excludeModules || {
        'require': 1,
        'exports': 1,
        'module': 1
    };
    excludeModules[ moduleId ] = 1;


    // 当模块是一个package时，需要生成代理模块代码，原模块代码自动附加的id带有`main`
    // 否则，具名模块内部使用相对路径的require可能出错
    if ( pkgInfo ) {
        codes.push( getPackageMainCode( pkgInfo ) );
        moduleId = moduleInfo.id = pkgInfo.module;
        excludeModules[ pkgInfo.module ] = 1;
    }
    codes.push( require( './generate-module-code' )( moduleInfo ) );


    // combine模式时，合并所有依赖模块
    if ( combine ) {
        var fs = require( 'fs' );
        var dependencies = moduleInfo.actualDependencies;

        // 排除不期望被合并的模块
        (combine.exclude || []).forEach( 
            function ( moduleId ) {
                excludeModules[ moduleId ] = 1;
            }
        );

        // 添加额外期望被合并的模块
        (combine.include || []).forEach( 
            function ( moduleId ) {
                dependencies.push( moduleId );
            }
        );

        for ( var i = 0; i < dependencies.length; i++ ){
            // 如果依赖的是一个资源，需要合并的是资源加载的module
            // 所以依赖模块id应该是资源加载模块的id
            var depId = require( './resolve-module-id' )( 
                dependencies[ i ].split( '!' )[ 0 ], 
                moduleId
            );
            var depFile = require( './get-module-file' )( 
                depId, 
                moduleConfig
            );
            
            if ( !excludeModules[ depId ] && fs.existsSync( depFile ) ) {
                var depMainId = null;

                codes.push( compileModule( 
                    fs.readFileSync( depFile, 'UTF-8' ),
                    depId,
                    moduleConfig, 
                    true, 
                    excludeModules
                ) );
            }
        }
    }

    codes.reverse();
    return codes.join( '\n\n' );
};

module.exports = exports = compileModule;
