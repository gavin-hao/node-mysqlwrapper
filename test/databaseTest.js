/**
 * Created by zhigang on 14-8-11.
 */
var config = require('config');

var db = require('../index.js');
var cli = require('../lib/mysqlClient');


var data = db.getDatabase('roshan_sports');
db.query.executeScalar(data,'select 1',function(err,result){
    console.log(result);
})
data.getConnection(function (err, conn) {
    if (err) {
        console.log(err);
    }
    else {
        conn.query('select 1', function (err, res) {
            console.log(res);
        })
    }
});