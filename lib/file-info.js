
/**
 * 文件信息类
 * 
 * @inner
 * @constructor
 * @param {Object} options 初始化选项
 * @param {Buffer|string} options.data 文件数据
 * @param {string} options.extname 文件扩展名
 * @param {string} options.path 文件路径，相对于构建目录
 * @param {string} options.fullPath 文件完整路径
 */
function FileInfo( options ) {
    var data = options.data;
    // 二进制文件data为buffer
    // 文本文件data为字符串
    // 脑残才用gbk
    // 该检测方法为王杨提供
    this.data = 
        require( './util/is-binary-file' )( data )
        ? data
        : data.toString( 'UTF-8' );

    this.extname = options.extname;
    this.path = options.path;
    this.fullPath = options.fullPath;
    this.outputPath = this.path;

    // 保存一份raw data
    // 有的处理器可能直接针对或者获取源数据
    this.rawData = this.data.slice( 0 );

    this.dataTransfer = {};
}

/**
 * 设置文件数据
 * 
 * @param {Buffer|string} data 文件数据
 */
FileInfo.prototype.setData = function ( data ) {
    if ( !this.processFinished ) {
        this.data = data;
    }
};

/**
 * 获取属性数据信息。该数据信息用于processor存储文件处理状态
 * 
 * @param {string} name 属性名
 * @return {*}
 */
FileInfo.prototype.get = function ( name ) {
    return this.dataTransfer[ name ];
};

/**
 * 设置属性数据信息。该数据信息用于processor存储文件处理状态
 * 
 * @param {string} name 属性名
 * @param {*} value 属性值
 */
FileInfo.prototype.set = function ( name, value ) {
    this.dataTransfer[ name ] = value;
};

module.exports = exports = FileInfo;
