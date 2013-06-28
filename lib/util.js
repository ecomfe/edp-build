




/**
 * 判断url是否相对路径
 *
 * @param {string} url 路径
 * @return {boolean}
 */
exports.isRelativePath = function( url ) {
    return !/^([a-z]{2,10}:\/)?\//i.test( url );
};





/**
 * 编译模块
 * 
 * @param {string} code 模块代码
 * @param {string} moduleId 模块id
 * @param {string} moduleConfig 模块配置文件
 * @param {boolean=} combine 是否合并依赖编译
 * @param {Object=} excludeModules 如果合并依赖，需要一个对象指定不需要合并的模块
 * @return {string} 
 */
exports.compileModule = function ( 
    code, 
    moduleId, 
    moduleConfig, 
    combine, 
    excludeModules 
) {
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

    // 根据语法树分析模块
    var ast = require( 'esprima' ).parse( code );
    var moduleInfo = analyseModule( ast );
    if ( !moduleInfo || moduleInfo instanceof Array ) {
        return false;
    }

    // 附加模块id
    var pkgInfo;
    if ( !moduleInfo.id ) {
        moduleInfo.id = moduleId;
        pkgInfo = exports.getPackageInfo( moduleId, moduleConfig );
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
    codes.push( generateModuleCode( moduleInfo ) );

    // combine模式时，合并所有依赖模块
    if ( combine ) {
        var fs = require( 'fs' );
        var dependencies = moduleInfo.dependencies;
        for ( var i = 0; i < dependencies.length; i++ ){
            // 如果依赖的是一个资源，需要合并的是资源加载的module
            // 所以依赖模块id应该是资源加载模块的id
            var depId = exports.resolveModuleId( 
                dependencies[ i ].split( '!' )[ 0 ], 
                moduleId
            );
            var depFile = exports.getModuleFile( depId, moduleConfig );
            
            if ( !excludeModules[ depId ] && fs.existsSync( depFile ) ) {
                var depMainId = null;

                codes.push( exports.compileModule( 
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


var estraverse = require( 'estraverse' );
var SYNTAX = estraverse.Syntax;
var LITERAL_DEFINE = 'define';
var LITERAL_REQUIRE = 'require';

/**
 * 分析模块
 * 
 * @inner
 * @param {Object} ast 模块代码的ast
 * @return {Object} 模块信息，包含id, dependencies, factoryAst
 */
function analyseModule( ast ) {
    function isStringLiteral( node ) {
        return node 
            && node.type === SYNTAX.Literal 
            && typeof node.value === 'string';
    }

    var modules = [];
    ast.body.forEach( function ( defineStat ) {
        var defineExpr = defineStat 
            && defineStat.type === SYNTAX.ExpressionStatement
            && defineStat.expression;

        var moduleId;
        var dependencies;
        var factoryAst;
        var defineArgs;

        // 用于去重
        var dependenciesMap = {};

        if ( defineExpr
            && defineExpr.type === SYNTAX.CallExpression 
            && defineExpr.callee.name === LITERAL_DEFINE 
            && ( defineArgs = defineExpr.arguments ) 
        ) {
            for ( var i = 0; i < defineArgs.length; i++ ) {
                var argument = defineArgs[ i ];
                if ( !moduleId && isStringLiteral( argument ) ) {
                    moduleId = argument.value;
                }
                else if ( !dependencies && argument.type === SYNTAX.ArrayExpression ) {
                    dependencies = [];
                    argument.elements.forEach(
                        function ( element ) {
                            if ( isStringLiteral( element ) ) {
                                var depId = element.value;
                                dependencies.push( depId );
                                dependenciesMap[ depId ] = 1;
                            }
                            else {
                                throw new Error( 'Dependency must be string literal' );
                            }
                        }
                    );
                }
                else {
                    factoryAst = argument;
                    break;
                }
            }

            if ( !dependencies ) {
                dependencies = [ 'require', 'exports', 'module' ];
            }

            if ( factoryAst.type === SYNTAX.FunctionExpression ) {
                estraverse.traverse(
                    factoryAst,
                    {
                        enter: function ( item ) {
                            if ( item.type !== SYNTAX.CallExpression ) {
                                return;
                            }

                            var arg0;
                            var value;
                                
                            if ( item.callee.name === LITERAL_REQUIRE
                                && ( arg0 = item.arguments[ 0 ] )
                                && isStringLiteral( arg0 ) 
                                && ( value = arg0.value ) 
                                && ( !dependenciesMap[ value ] )
                            ) {
                                dependencies.push( value );
                                dependenciesMap[ value ] = 1;
                            }
                        }
                    }
                );
            }

            modules.push( {
                id: moduleId,
                dependencies: dependencies,
                factoryAst: factoryAst
            } );
        }
    } );
    
    switch ( modules.length ) {
        case 0:
            return null;
        case 1:
            return modules[ 0 ];
    }

    return modules;
}



/**
 * 获取module id
 * 
 * @param {string} moduleFile module文件路径
 * @param {string} moduleConfigFile module配置文件路径
 * @return {string}
 */
exports.getModuleId = function ( moduleFile, moduleConfigFile ) {
    var path = exports.path;
    moduleFile = moduleFile.replace( /\.js$/, '' );
    var relativePath = path.relative( 
        path.dirname( moduleConfigFile ), 
        moduleFile
    );
    var moduleConfig = exports.readJson( moduleConfigFile );
    var baseUrl = moduleConfig.baseUrl + '/';

    // try match packages
    var packages = moduleConfig.packages || [];
    for ( var i = 0; i < packages.length; i++ ) {
        var pkg = packages[ i ];
        var pkgName = pkg.name;
        var pkgMain = pkg.main || 'main';
        var pkgLoc = pkg.location;

        if ( !exports.isRelativePath( pkgLoc ) ) {
            continue;
        }

        if ( relativePath.indexOf( pkgLoc ) === 0 ) {
            if ( relativePath === pkgLoc + '/' + pkgMain ) {
                return pkgName;
            }

            return pkgName + relativePath.replace( pkgLoc, '' );
        }
    }

    // try match paths
    var pathKeys = Object.keys( moduleConfig.paths || {} ).slice( 0 );
    pathKeys.sort( function ( a, b ) { return b.length - a.length; } );
    for ( var i = 0; i < pathKeys.length; i++ ) {
        var key = pathKeys[ i ];
        var modulePath = moduleConfig.paths[ key ];

        if ( !exports.isRelativePath( modulePath ) ) {
            continue;
        }

        modulePath = baseUrl + '/' + modulePath;
        if ( relativePath.indexOf( modulePath ) === 0 ) {
            return relativePath.replace( modulePath, key );
        }
    }

    // try match baseUrl
    if ( relativePath.indexOf( baseUrl ) === 0 ) {
        return relativePath.replace( baseUrl, '' );
    }

    return null;
};


/**
 * 从内容中寻找入口模块
 * 
 * @param {string} content 查找内容源
 * @param {string} contentType 内容类型，js|html
 * @return {Array}
 */
exports.findEntryModules = function ( content, contentType ) {
    var mods = [];
    var modsCache = {};

    function findFromJsCode( code ) {
        var ast = require( 'esprima' ).parse( code );
        
        estraverse.traverse(
            ast,
            {
                enter: function ( node ) {
                    var arrayArg;
                    if ( node.type === SYNTAX.CallExpression 
                        && node.callee.name === LITERAL_REQUIRE
                        && ( arrayArg = node.arguments[ 0 ] )
                        && arrayArg.type === SYNTAX.ArrayExpression
                    ) {
                        arrayArg.elements.forEach( function ( item ) {
                            var value;
                            if ( item.type === SYNTAX.Literal 
                                && ( value = item.value )
                                && typeof value === 'string' 
                                && !modsCache[ value ]
                            ) {
                                mods.push( value );
                                modsCache[ value ] = 1;
                            }
                        } );
                    }
                }
            }
        );
    }

    if ( contentType === 'js' ) {
        findFromJsCode( content ); 
    }
    else {
        exports.findScriptTexts( content ).forEach( 
            function ( text ) {
                findFromJsCode( text );
            }
        );
    }

    return mods;
};

/**
 * html片段中查询script标签的innerText
 * 
 * @param {string} content html片段内容
 * @return {Array.<string>} 每个标签一个数组项
 */
exports.findScriptTexts = function ( content ) {
    // script标签就算有属性，属性值里总不会带有“>”吧
    var segs = content.split( /<script[^>]*>/ );
    var texts = [];
    for ( var i = 1; i < segs.length; i++ ) {
        texts.push( segs[ i ].split( /<\/script>/ )[ 0 ] );
    }

    return texts;
};




