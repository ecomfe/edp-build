/**
 * @file 根据模块Id获取模块的文件路径
 * @author errorrik[errorrik@gmail.com]
 *         leeight[leeight@gmail.com]
 */
var fs = require( 'fs' );
var edp = require( 'edp-core' );

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
        + '\'], function ( main ) { return main; });';
}


/**
 * 合并模块的代码
 * 
 * @param {ModuleInfo} moduleInfo 入口模块的信息.
 * @param {string} moduleConfig module.conf的路径.
 * @param {Object} excludeModules 需要排除的模块Id集合.
 */
function combineModuleCode( moduleInfo, moduleConfig, excludeModules ) {
    var combineModules = moduleInfo.combineModules;

    var codes = [];
    for ( var i = 0; i < combineModules.length; i++ ) {
        // 如果依赖的是一个资源，需要合并的是资源加载的module
        // 所以依赖模块id应该是资源加载模块的id
        var depId = combineModules[ i ];
        if ( excludeModules[ depId ] ) {
            continue;
        }

        var depFile = edp.amd.getModuleFile(
            depId,
            moduleConfig
        );

        if ( fs.existsSync( depFile ) ) {
            excludeModules[ depId ] = 1;

            var code = compileModule(
                fs.readFileSync( depFile, 'UTF-8' ),
                depId,
                moduleConfig,
                // 我们不传递include下去，因为第一个入口文件能看到include的内容，所以相关的代码已经包含进来了，
                // 后续的文件看不到也没关系，另外传递下去可能导致无限递归
                //
                // 我们也不传递exclude下去，因为第一次的时候，已经把exclude中的pattern全部展开了，所以
                // 此时excludeModules里面是没有pattern的，都是具体的moduleId，因此不需要传递最原始的combine.exclude了
                //
                // 综上所述，递归调用的时候，我们只需要传递{}，表明需要combine即可.
                //
                // @see edp-build#19
                {},
                excludeModules
            );

            if ( !code ) {
                edp.log.warn(
                    'Combine module code failed, can\'t combine [%s] to [%s]',
                    depId, moduleInfo.id
                );
            }
            else {
                codes.push( code );
            }
        }
    }

    return codes;
}


/**
 * 初始化合并模块过程中的 excludeModules 对象，这个对象在递归调用的过程中会被修改。
 * 另外会修改入口模块的actualDependencies，把explicitIncludeModules的内容追加进去。
 *
 * @param {ModuleInfo} moduleInfo 入口模块的信息
 * @param {{exclude: Object, include: Object}} moduleSet 模块的集合.
 *
 * @return {Object}
 */
function initExcludeModules( moduleInfo, moduleSet ) {
    var moduleId = moduleInfo.id;

    var explicitExcludeModules = moduleSet.exclude;
    explicitExcludeModules[ moduleId  ] = 1;
    explicitExcludeModules[ 'require' ] = 1;
    explicitExcludeModules[ 'exports' ] = 1;
    explicitExcludeModules[ 'module'  ] = 1;

    // 但是processor的处理逻辑是先exclude，然后再include
    // 逻辑应该是先include，然后再exclude
    // 为了更好的处理顺序的问题，我们需要支持 modules 参数
    // modules: [
    //   'esui/**',
    //   '!esui/Sidebar'
    // ]
    var explicitIncludeModules = moduleSet.include;
    var combineModules = moduleInfo.combineModules;
    combineModules.push.apply( combineModules, Object.keys( explicitIncludeModules ) );

    var len = combineModules.length;
    while( len -- ) {
        var depId = combineModules[ len ];
        if ( explicitExcludeModules[ depId ] ) {
            combineModules.splice( len, 1 );
        }
    }

    return explicitExcludeModules;
}

/**
 * 初始化当前模块的所有依赖模块信息
 * 剥离resource里的moduleId，以及对依赖的moduleId进行normalize
 * 
 *
 *   er -> require( './util' )
 *   ./util -> er/util
 *
 * @param {ModuleInfo} moduleInfo 需要处理的模块信息.
 */
function initCombineModules( moduleInfo ) {
    var moduleId = moduleInfo.id;

    var combineModules = moduleInfo.actualDependencies.map(
        function( resourceId ){
            var depId = edp.amd.resolveModuleId(
                resourceId.split( '!' )[0],
                moduleId
            );

            return depId;
        });

    moduleInfo.combineModules = combineModules;
}

/**
 * process.env._CACHE是用来缓存结果的，保证不同的文件如果需要
 * combine的时候，只需要整体扫描一次.
 *
 * @return {Array.<string>}
 */
var _CACHE = null;
function getAllModules( moduleConfig ) {
    return _CACHE || ( _CACHE = edp.amd.getAllModules( moduleConfig ) );
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
function compileModule( code, moduleId, moduleConfig, combine, excludeModules ) {
    //{{{ 根据语法树分析模块
    var ast = edp.amd.getAst( code );
    if ( !ast ) {
        edp.log.fatal('Parse module code failed, moduleId = [%s], moduleConfig = [%j], combine = [%s]',
            moduleId, moduleConfig, combine);
        return false;
    }

    var moduleInfo = edp.amd.analyseModule( ast );
    if ( !moduleInfo || moduleInfo instanceof Array ) {
        edp.log.warn('Can\'t find moduleInfo for [%s], moduleConfig = [%j]',
            moduleId, moduleConfig);
        return false;
    }

    // 附加模块id
    var pkgInfo;
    if ( !moduleInfo.id ) {
        // 可能是匿名模块
        pkgInfo = require( './get-package-info' )( moduleId, moduleConfig );

        // require( 'er' ) -> moduleInfo.id = pkgInfo.module = 'er/main'
        moduleInfo.id = pkgInfo ? pkgInfo.module : moduleId;
    }
    //}}}

    // 模块代码数组容器
    var codes = [];

    // combine模式时，合并所有依赖模块
    if ( combine ) {
        // 初始化 explicitExcludeModules 和 explicitIncludeModules 这两个数组
        // 因为初始化的工作代价比较大，因此只初始化一次，后续就往下面传递即可.
        //
        // edp.amd.getAllModules( moduleConfig )
        //   主要的工作就是根据module.conf的baseUrl和packages里面配置的目录，扫描出
        //   所有的js，然后计算js的moduleId
        //
        // 获取了一个项目的所有moduleId之后，开始根据exclude和include的的pattern过滤出相应的moduleId

        var ab = require( './array' );

        var explicitExcludeModules = {};
        var explicitIncludeModules = {};

        // https://github.com/ecomfe/edp/issues/187
        // files模式 vs include+exclude模式
        var patterns = null;
        var modules = combine.files || combine.modules;
        if ( !modules || !Array.isArray( modules ) ) {
            // 如果存在include和exclude，那么 modules = include.concat( exclude )
            var includeModulePatterns = ab.expand( combine.include || [] );
            var excludeModulePatterns = ab.expand( combine.exclude || [] );
            patterns = includeModulePatterns.concat(
                excludeModulePatterns.map( function( item ){ return '!' + item; } ) );
        }
        else {
            patterns = ab.expand( modules );
        }

        var allModules = getAllModules( moduleConfig );
        patterns.forEach(function( pattern ){
            if ( pattern[ 0 ] === '!' ) {
                pattern = pattern.substring( 1 );

                // exclude pattern
                // 1. 从allModules里面找到符合pattern的内容，放到explicitExcludeModules
                // 2. 从explicitIncludeModules里面删除
                allModules.forEach(function( item ){
                    if ( edp.path.satisfy( item, pattern ) ) {
                        explicitExcludeModules[ item ] = 1;
                        delete explicitIncludeModules[ item ];
                    }
                });
            }
            else {
                // include pattern
                // 1. 从allModules里面找到符合pattern的内容，放到explicitIncludeModules
                allModules.forEach(function( item ){
                    if ( edp.path.satisfy( item, pattern ) ) {
                        explicitIncludeModules[ item ] = 1;
                        delete explicitExcludeModules[ item ];
                    }
                });
            }
        });

        initCombineModules( moduleInfo );

        // 递归调用的时候，会传递excludeModules参数，因此只有第一次的时候会调用initExcludeModules，也就是
        // 只有第一次调用的时候会给入口模块的dependencies添加 explicitIncludeModules 的内容. 后续即便想追加，实际上
        // explicitIncludeModules 的内容是空，所以对moduleInfo.dependencies没有实质的影响
        excludeModules = excludeModules ||
            initExcludeModules( moduleInfo, {
                exclude: explicitExcludeModules,
                include: explicitIncludeModules
            } );
        var depCodes = combineModuleCode( moduleInfo, moduleConfig, excludeModules );
        codes.push.apply( codes, depCodes );

        if ( moduleId !== moduleInfo.id ) {
            // XXX 处理的是 er 和 er/main 的情况
            excludeModules[ moduleInfo.id ] = 1;
            excludeModules[ moduleId ] = 1;
        }
    }

    // TODO(user) 如果我excludeModules里面有入口模块moduleInfo.id，应该如何处理呢？
    codes.push( require( './generate-module-code' )( moduleInfo, ast ) );

    // 当模块是一个package时，需要生成代理模块代码，原模块代码自动附加的id带有`main`
    // 否则，具名模块内部使用相对路径的require可能出错
    if ( pkgInfo ) {
        // edp.amd.getModuleId( file )
        // 如果file是一个package的主模块，此时返回的是package name，不是[package name, package name/main module]
        // 因此在这里人肉补充上main module的信息.
        codes.push( getPackageMainCode( pkgInfo ) );
    }
    else {
        // 因为module.conf里面的配置导致模块存在别名，这是一个很正常的情况，但是
        // 对于build代码来说是很SB的情况
        // {
        //   "paths": {
        //     "tpl": "common/tpl"
        //   }
        // }
        //
        // // src/common/main.js
        // define(function(require){
        //   require( 'tpl' );
        //   require( './tpl' );
        //   require( 'common/tpl' );
        // });
        //
        // 那么当合并 common/main 的时候，需要合并两个文件
        // 1. src/common/main.js
        // 2. src/common/tpl.js
        //
        // 代码里面需要出现3个module id的定义
        // define('common/tpl', ...)
        // define('tpl', function(require){ return require( 'common/tpl' ); });
        // define('common/main', ...)
        codes.push.apply( codes,
            appendModuleAliasDeclaration( moduleInfo, moduleConfig, excludeModules ));
    }

    return codes.join( '\n\n' );
}

/**
 * @param {ModuleInfo} moduleInfo
 * @param {string} moduleConfig
 * @param {Object} excludeModules
 *
 * @return {Array.<string>}
 */
function appendModuleAliasDeclaration( moduleInfo, moduleConfig, excludeModules ) {
    var codes = [];

    var file = edp.amd.getModuleFile( moduleInfo.id, moduleConfig );
    var moduleIds = edp.amd.getModuleId( file, moduleConfig );
    var tpl = '\n/** d e f i n e */\ndefine(\'%s\', [\'%s\'], function (target) { return target; });';

    for( var i = 0; i < moduleIds.length; i ++ ) {
        var moduleId = moduleIds[ i ];

        // 如果存在excludeModules，那么应该是如下的情况：
        // 1. 递归调用的时候传递了 excludeModules 参数.
        // 2. 入口模块指定了combine参数.
        // 此时都需要检查是否已经合并过了，否则可能会出现重复的代码.
        if ( excludeModules ) {
            if ( excludeModules[ moduleId ] ) {
                continue;
            }
            codes.push( require( 'util' ).format( tpl, moduleId, moduleInfo.id ) );
            excludeModules[ moduleId ] = 1;
        }
        else {
            // 没有 excludeModules
            // 1. 入口模块没有指定combine参数，我们需要处理一遍所有入口模块的别名.
            if ( moduleId !== moduleInfo.id ) {
                codes.push( require( 'util' ).format( tpl, moduleId, moduleInfo.id ) );
            }
        }
    }

    return codes;
}

module.exports = exports = compileModule;
