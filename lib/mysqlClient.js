/**
 * Created by zhigang on 14-9-3.
 */

var config = require('config');
var util = require('util');
var mysql = require('mysql');
var CONFIG_NAME = 'dbconnections';
var _ = require('lodash');
function dbconnection(options) {
    var _default = {
        connectionLimit: 5,
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test',
        port: 3306

    }
    this.connectionOptions = _.defaults(options || {}, _default);
    this.name = this.connectionOptions.name;
    this.connectionPool = mysql.createPool(this.connectionOptions);
    var _name=this.connectionOptions.name;
    this.connectionPool.on('connection', function (connection) {
        util.debug('--- new connetion by pool:' + _name);
    });
    this.connectionPool.on('enqueue', function () {
        util.debug('Waiting for available connection slot');
    });
}
dbconnection.prototype.close = function () {
    var self=this;
    this.connectionPool.end(function(err){
        util.debug('all connections in the pool have ended---pool:'+self.name)
    });
}
dbconnection.prototype.getConnection = function (cb) {
    return this.connectionPool.getConnection(cb);
}
var database = (function () {
    var _pools = [];
    var _dbSettings = config.get(CONFIG_NAME);

    function client() {

        var s = _.toArray(_dbSettings);
        if (!(s && s.length > 0)) {
            throw  Error('init dbClient error,cannot load dbconnection config')
        }
        _dbSettings.on('changed', function (config) {
            //reconnect when config changed
            reConnect(config);
        });

        function reConnect(config) {

            for (var i = 0; i < _pools.length; i++) {
                var _current = _pools[i];
                var _name = _current.name;
                var new_conf = _.find(config, {name: _name});
                var changed = !_.isEqual(_current.connectionOptions, new_conf);
                if (changed) {
                    util.debug(_name + ' db connection option changed!  reconnecting...');
                    _current.close();
                    _pools[i] = null;
                    _pools[i] = new dbconnection(new_conf);
                }
            }
        }
    }

    client.prototype.getDatabase = function (name) {
        var self = this;
        var pool = _.find(_pools, {'name': name});
        if (!pool) {

            var opts = _.find(_dbSettings, {name: name});
            pool = new dbconnection(opts);
            _pools.push(pool);
        }

        return _.find(_pools, {'name': name});

    };
    var _instance = null;
    return{
        getInstance: function () {
            if (!_instance) {
                _instance = new client();
            }
            return _instance;
        }}
})();
exports.database = database;
exports.dbconnection = dbconnection;
