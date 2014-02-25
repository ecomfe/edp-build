/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * analyse-module.js ~ 2014/02/24 22:06:20
 * @author leeight(liyubei@baidu.com) erik(erik@baidu.com)
 * @version $Revision$ 
 * @description 
 * 分析js文件中用到的resourceId
 **/
var edp = require( 'edp-core' );

/**
 * 分析模块
 * 
 * @param {Object} ast 模块代码的ast
 * @return {Object|Array} 模块信息，或模块信息数组。
 *                        每个模块信息包含id, dependencies, factoryAst, actualDependencies
 */
module.exports = exports = function ( ast ) {
    return edp.esl.analyseModule( ast );
}
