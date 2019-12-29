var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "frp",
    password: "fr2019",
    port: "3306",
    database: "face_recognition",
    timezone: "utc+0",
    dateStrings: true
});

const express = require('express');
const app = express();
var server = require('http').Server(app)
var io = require('socket.io')(server);
var excel = require('exceljs');
var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/img'));
app.use(express.static(__dirname + '/excel'));

app.get('/', function (req, res) {
    console.log('Index Log!!');
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.on('getAllServer', () => {
        var queryInitial = 'SELECT VS_INITIAL.*, ' +
            '(CASE ' +
                'WHEN DATE_FORMAT(VS_INITIAL.min_date, \"%T\") <= \"11:00:00\" ' +
                'AND DATE_FORMAT(VS_INITIAL.max_date, \"%T\") >= \"14:30:00\" ' +
                    'THEN \"Hak Kazandi\" ' +
                'ELSE \"Uygun Degil\" ' +
            'END) AS \"Sodexo\" ,' +
            '(CASE ' +
                'WHEN DATE_FORMAT(VS_INITIAL.min_date, \"%T\") >= \"09:30:00\" ' +
                    'THEN \"Gec Geldi\" ' +
                'ELSE \" - \" ' +
            'END) AS \"Gecikme Durumu\" ' +
            'FROM(SELECT user, min(date) as min_date, max(date) as max_date, ' +
            'TIMESTAMPDIFF(MINUTE, min(date), max(date)) AS timediff FROM`video_stream` WHERE date >= CURRENT_DATE ' +
            'GROUP BY user) AS VS_INITIAL ' +
            'ORDER BY DATE_FORMAT(min_date, \"%Y-%m-%d %T\"), ' +
                     'DATE_FORMAT(max_date, \"%Y-%m-%d %T\"), user ASC '
        con.query(queryInitial, function (err, result, fields) {
            console.log("started");
            console.log("results : " + result);
            console.log("fields:" + fields);
            const jsonResult = JSON.parse(JSON.stringify(result));
            console.log(jsonResult);
            io.emit('getAllClient', { jsonResult })
        });
    });
    socket.on('getFilteredServer', (data) => {
        var flag = 0;
        var queryFiltered = 'SELECT VS_FILTER.*, ' +
            '(CASE ' +
                'WHEN DATE_FORMAT(VS_FILTER.min_date, \"%T\") <= \"11:00:00\" ' +
                'AND DATE_FORMAT(VS_FILTER.max_date, \"%T\") >= \"14:30:00\" ' +
                    'THEN \"Hak Kazandi\" ' +
                'ELSE \"Uygun Degil\" ' +
            'END) AS \"Sodexo\" ,' +
            '(CASE ' +
                'WHEN DATE_FORMAT(VS_FILTER.min_date, \"%T\") >= \"09:30:00\" ' +
                    'THEN \"Gec Geldi\" ' +
                'ELSE \" - \" ' +
            'END) AS \"Gecikme Durumu\" ' +
            'FROM (SELECT user, min(date) as min_date, max(date) as max_date, ' +
            'TIMESTAMPDIFF(MINUTE, min(date), max(date)) AS timediff FROM`video_stream` ' +
            'GROUP BY YEAR(date), MONTH(date), DAY(date), user) AS VS_FILTER WHERE ';
        if (data.user) {
            queryFiltered += ('user = \"' + data.user + '\"');
            flag = 1;
        }
        if (data.start_date) {
            if (flag == 1) {
                queryFiltered += ' AND '
            }
            queryFiltered += ('DATE_FORMAT(min_date, ' + '\"%m/%d/%Y\"' + ') >= \"' + data.start_date + '\" ');
            flag = 1;
        }
        if (data.end_date) {
            if (flag == 1) {
                queryFiltered += ' AND '
            }
            queryFiltered += ('DATE_FORMAT(max_date, ' + '\"%m/%d/%Y\"' + ') <= \"' + data.end_date + '\" ');
            flag = 1;
        }
        queryFiltered += (' ORDER BY DATE_FORMAT(min_date, \"%Y-%m-%d %T\"), DATE_FORMAT(max_date, \"%Y-%m-%d %T\"), user ASC;');
             
        con.query(queryFiltered, function (err, result, fields) {

            if (err) throw err;
            console.log(result);

            console.log("filtration");
            console.log("results : " + result);
            console.log("fields:" + fields);
            const jsonResult = JSON.parse(JSON.stringify(result));
            console.log(jsonResult);
            io.emit('getFilteredClient', { jsonResult })
        });
    });

    socket.on('convertToExcelServer', (data) => {
        let workbook = new excel.Workbook(); //creating workbook
        let worksheet = workbook.addWorksheet('Face Recognition'); //creating worksheet

        //  WorkSheet Header
        worksheet.columns = [
            { header: 'User Name', key: 'user', width: 30 },
            { header: 'ENTRY DATE', key: 'min_date', width: 30, outlineLevel: 1  },
            { header: 'EXIT DATE', key: 'max_date', width: 30, outlineLevel: 1  },
            { header: 'TOTAL WORK TIME(m)', key: 'timediff', width: 25 },
            { header: 'SODEXO', key: 'Sodexo', width: 20 },
            { header: 'GECIKME DURUMU', key: 'Gecikme Durumu', width: 20 },
        ];
        
        // Add Array Rows
        worksheet.addRows(data.jsonData);

        // Write to File
        workbook.xlsx.writeFile("./excel/UserList.xlsx")
            .then(function () {
                console.log("file saved!");
            });
        io.emit('convertToExcelClient')
    });

});
console.log(`Listening on port ${port}`)
server.listen(port);
//app.listen(port, () => console.log(`Listening on port ${port}`));