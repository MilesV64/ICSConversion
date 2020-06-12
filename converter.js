
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const moment = require('moment');

//returns filename of new file
function convertFile(file, newDate) {
    
    return new Promise((resolve, reject) => {
        const startDate = getEarliestDate(file)

        startDate.then((res, rej) => {
    
            //get difference in days between the current start date and given new date
            const newDateMoment = moment(newDate, 'MM/DD/YYYY');
            const diff = newDateMoment.diff(res, 'days');
            
            const newFile = createConvertedFile(file, diff);

            newFile.then((res, rej) => {
                resolve(newFile);
            });
    
        });
    });
    
    
    
    
}

/*
    Write a new file by reading over the old file line by line and transfering over each line
    while converting dates when necessary

    Uses much of the same logic as getEarliestDate
*/
function createConvertedFile(file, diff) {
    return new Promise((resolve, reject) => {

        const fileName = path.parse(file.name).name + 'Converted.ics';

        const rl = readline.createInterface({
            input: fs.createReadStream(file.path),
            crlfDelay: Infinity
        });

        const ws = fs.createWriteStream(fileName, {
            flags: 'a'
        })

        //tracks whether the line is inside a VEVENT block, which is where the dates we want are
        var isVEVENT = false

        rl.on('line', (line) => {
            const splitLine = line.split(':');

            if (splitLine[0] == 'BEGIN' && splitLine[1] == 'VEVENT') {
                isVEVENT = true
                ws.write(line + '\n');
            }
            else if (splitLine[0] == 'END' && splitLine[1] == 'VEVENT') {
                isVEVENT = false
                ws.write(line + '\n');
            }
            else if (isVEVENT) {
                //convert the start and end dates, plus alarms
                const dateLine = line.split(';');
                if (dateLine[0] == 'DTSTART' || dateLine[0] == 'DTEND' || dateLine[0] == 'TRIGGER') {
                    //we can use earlier splitLine to get just the date since there's only 1 ':' in these lines
                    const date = moment(splitLine[1], 'YYYYMMDDTHHmmSS');
                    date.add(diff, 'days');

                    ws.write(splitLine[0] + ':' + date.format('YYYYMMDDTHHmmSS') + '\n');

                }
                else {
                    //part of VEVENT but not the dates, transfer without adjutments
                    ws.write(line + '\n');
                }
            }
            else {
                //not part of VEVENT, transfer the line without adjustments
                ws.write(line + '\n');
            }

        });

        rl.on('close', () => {
            ws.end();
        });

        ws.on('finish', () => {
            resolve(fileName);
       });

    });

}


/*
    Get earliest date by cycling through entire file to find the earliest event's start date.
    ICS files are not gaurenteed to be sorted by date

    Asynchronously reading line by line because files could be very large
*/
function getEarliestDate(file) {

    return new Promise((resolve, reject) => {
        var earliestDate = null;

        const rl = readline.createInterface({
           input: fs.createReadStream(file.path),
           crlfDelay: Infinity
        });
    
        //tracks whether the line is inside a VEVENT block, which is where the dates we want are
        var isVEVENT = false

        rl.on('line', (line) => {
            const splitLine = line.split(':');

            if (splitLine[0] == 'BEGIN' && splitLine[1] == 'VEVENT') {
                isVEVENT = true
            }
            else if (splitLine[0] == 'END' && splitLine[1] == 'VEVENT') {
                isVEVENT = false
            }
            else {
                if (isVEVENT) {
                /*
                Format is DTSTART;<timezone info or lack thereof>:YYYYMMDDTHHMMSS
                */
                    if (line.split(';')[0] == 'DTSTART') {

                        //we can use earlier splitLine to get just the date since there's only 1 ':' in these lines
                        const date = moment(splitLine[1], 'YYYYMMDDTHHmmSS');

                        if (earliestDate === null || date.isBefore(earliestDate)) {
                            earliestDate = date;
                        }
                    
                    }
                }
            }
        
        });

        rl.on('close', () => {
            resolve(earliestDate);
        });

      });

}

module.exports.convertFile = convertFile;