const mySql = require('mysql2');
const connection = mySql.createConnection({
    host:'localhost',
    user:'root',
    password:'0021',
    database:'shade_system_db'
});
connection.connect((err)=>{
    if(err){
        console.log('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});
module.exports = connection;