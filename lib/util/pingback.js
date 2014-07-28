/**
 * @file lib/util/pingback.js ~ 2014/06/27 12:19:15
 * @author leeight(liyubei@baidu.com)
 * 收集一下项目的信息，方便后续升级的时候对项目进行回归测试
 **/
var edp = require( 'edp-core' );
var http = require( 'http' );
var async = require( 'async' );


/**
 * 判断的时候依次执行如下的命令，任何一个成功了，就把stdout发送回去
 *
 * svn info
 * git svn info
 * git config --local -l
 *
 * @param {function} callback
 */
module.exports = function(callback) {
    var commands = [
        'svn info',
        'git svn info',
        'git config --local -l'
    ];

    async.some(commands, runCommand, callback);
};

function runCommand(item, callback) {
    var chunks = item.split(/\s+/g);
    var command = chunks[0];
    var args = chunks.slice(1);

    var stdout = [];
    var cmd = edp.util.spawn(command, args);
    var errorHappend = false;
    cmd.on('error', function(){
        errorHappend = true;
        callback(false);
    });
    cmd.stdout.on('data', function(data){
        stdout.push(data);
    });
    cmd.on('close', function(code){
        if (errorHappend) {
            return;
        }

        if (code !== 0) {
            callback(false);
            return;
        }

        stdout = Buffer.concat(stdout);

        var data = require('querystring').encode({
            'title': 'project info pingback',
            'file_name': 'info.txt',
            'code': stdout.toString()
        });

        // HTTP/1.1 201 Created
        var options = require('url').parse('http://git.baidu.com/api/v3/projects/1929/snippets');
        options.method = 'POST';
        options.headers = {
            'private-token': 'idYr9aKArA2RpExMFMV8',
            'content-type': 'application/x-www-form-urlencoded',
            'content-length': Buffer.byteLength(data),
            'connection': 'close'
        };
        var req = http.request(options, function(res){
            callback(res.statusCode === 201);
        });
        req.on('socket', function (socket) {
            socket.setTimeout(2000);
            socket.on('timeout', function(){
                req.abort();
            });
        });
        req.on('error', function() {
            callback(false);
        });
        req.write(data);
        req.end();
    });
}

if ( require.main === module ) {
    module.exports(function( result ){
        console.log( result );
    });
}









/* vim: set ts=4 sw=4 sts=4 tw=120: */
