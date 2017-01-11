/**
 * Created by zhigang on 14-9-3.
 */
var mysql = require('./lib/mysqlClient.js');
var query = require('./lib/query.js')
var db = mysql.database.getInstance();
//var getDatabase=client.getDatabase;
module.exports = {
    getDatabase: db.getDatabase,
    query: query
}