/**
 * Created by zhigang on 14-9-15.
 */
var db = require('./mysqlClient.js').database;
var dbconnection = require('./mysqlClient.js').dbconnection;
var mysql = require('mysql');

//返回insert，update，delete查询的结果，包含 affectRows／ insertId／changedRows
function executeNonQuery(db, sql, parameter, callback) {

    if (typeof parameter === 'function') {
        callback = parameter;
        parameter = undefined;
    }
    callback = callback || function () {
    };
    if (!db || !(db instanceof dbconnection)) {
        callback(new Error('need db [instance of dbconnection]'), 0);
    } else if (typeof sql === 'undefined') {
        callback(new Error('invalid parameter [sql]'), 0);
    }
    else {
        db.getConnection(function (err, conn) {
            if (err) {
                callback(err, 0);
            } else {
                conn.query(sql, parameter, function (err, result) {
                    if (err) {
                        conn.release();
                        callback(err, result);
                    }
                    else {
                        conn.release();

                        callback(null, result);
                    }
                });
            }
        })
    }
}
//返回查询的 第一行数据
function executeScalar(db, sql, parameter, callback) {

    if (typeof parameter === 'function') {
        callback = parameter;
        parameter = undefined;
    }
    callback = callback || function () {
    };
    if (!db || !(db instanceof dbconnection)) {
        callback(new Error('need db [instance of dbconnection]'), 0);
    } else if (typeof sql === 'undefined') {
        callback(new Error('invalid parameter [sql]'), 0);
    } else {
        db.getConnection(function (err, conn) {
            if (err) {
                callback(err, null);
            } else {
                conn.query(sql, parameter, function (err, result) {
                    if (err) {
                        conn.release();
                        callback(err, result);
                    }
                    else {
                        conn.release();
                        callback(null, result[0]);
                    }
                });
            }
        })
    }
}
//执行查询，并且对查询结果集进行转换mapperFun
function executeAndMapResults(db, sql, parameter, mapperFun, callback) {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 3) {
        throw new Error('invalid parameter!')
    }
    if (mapperFun === 'undefined' && typeof callback === 'undefined' && typeof parameter === 'function') {
        callback = parameter;
        mapperFun = function (qResult) {
            return qResult;
        }
        parameter = undefined;
    }
    else if (typeof callback === 'undefined' && typeof parameter === 'function' && mapperFun === 'function') {
        callback = mapperFun;
        mapperFun = parameter;
        parameter = undefined;
    }
    else if (typeof callback === 'undefined' && typeof mapperFun === 'function' && typeof parameter != 'function') {
        callback = mapperFun;
        mapperFun = function (qResult) {
            return qResult;
        }
    }
    if (typeof parameter === 'function') {
        parameter = undefined;
    }
    if (!mapperFun) {
        mapperFun = function (qResult) {
            return qResult;
        }
    }
    callback = callback || function () {
    };
    if (!db || !(db instanceof dbconnection)) {
        callback(new Error('need db [instance of dbconnection]'), 0);
    } else if (typeof sql === 'undefined') {
        callback(new Error('invalid parameter [sql]'), 0);
    }

    if (!db || !(db instanceof dbconnection)) {
        return callback(new Error('need db instance [type: dbconnection]'), null);
    } else {
        db.getConnection(function (err, conn) {
            if (err) {
                callback(err, null);
            } else {
                conn.query(sql, parameter, function (err, result) {
                    if (err) {
                        conn.release();
                        callback(err, result);
                    }
                    else {
                        conn.release();
                        try {

                            result.resultsCount = this._fields.length;

                            var ret = mapperFun(result);
                            callback(null, ret);
                        }
                        catch (err) {
                            var error = new Error('type cast error--' + JSON.stringify(err));
                            callback(error, result);
                        }

                    }
                });
            }
        })
    }
}

function executeAndGetObjectList(db, sql, parameter, recordMapper, callback) {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 3) {
        throw new Error('invalid parameter!')
    }
    if (typeof parameter === 'function' && typeof recordMapper === 'function' && typeof callback === 'undefined') {
        callback = recordMapper;
        recordMapper = parameter;
        parameter = undefined;
    }
    else if (typeof callback === 'undefined' && typeof recordMapper === 'undefined' && typeof parameter === 'function') {
        callback = parameter;
        recordMapper = function (qResult) {
            return qResult;
        }
        parameter = undefined;
    }
    else if (typeof callback === 'undefined' && typeof recordMapper === 'function' && typeof parameter != 'function') {
        callback = recordMapper;
        recordMapper = function (qResult) {
            return qResult;
        }
    }
    if (!recordMapper) {
        recordMapper = function (qResult) {
            return qResult;
        }
    }
    callback = callback || function () {
    };
    executeAndMapResults(db, sql, parameter, function (result) {
        var rows;
        if (result.resultsCount > 1) {
            rows = result[0];
        }
        else {
            rows = result;
        }
        var ret = [];
        if (rows) {

            rows.forEach(function (row) {
                ret.push(recordMapper(row));
            });
        }
        return ret;

    }, function (err, list) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, list);
        }
    });
}
module.exports = {
    executeNonQuery: executeNonQuery,
    executeScalar: executeScalar,
    executeAndMapResults: executeAndMapResults,
    executeAndGetObjectList: executeAndGetObjectList
}