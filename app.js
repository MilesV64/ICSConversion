
const express = require('express');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const converter = require('./converter');
const app = express();

// Send initial html form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/home.html'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/styles.css'));
});

// Receive the data from the form
app.post('/fileupload', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        const file = files.filetoupload
        const newDate = fields.newdate
        
        const newFile = converter.convertFile(file, newDate);
        newFile.then((result, reject) => {
            res.download(result, (err) => {
                //delete local file once it's been sent
                fs.unlink(result, (err) => {});
            });
        });

    });
});

app.listen(3000, () => {
    console.log("Started server on port 3000");
});

