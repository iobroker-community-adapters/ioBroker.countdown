/**
 *
 *      ioBroker COUNTDOWN Adapter
 *
 *      (c) 2019 Alexander K <blacksonj7@gmail.com>
 *
 *      MIT License
 *
 */

'use strict';
const translateJS = require('./translate.js'); // translate
const a = new translateJS();

const utils = require('@iobroker/adapter-core');
const stateAttr = require('./lib/stateAttr.js'); // State attribute definitions

const moment = require('moment');
const tableify = require(`tableify`);
let AdapterStarted;
let Interval;
let translateObject = {};
let storagename = '';
let countdownData;

const warnMessages = {};

let adapter;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: 'countdown',
        ready: function () {
            Interval = setInterval(function () {
                // alle 1 Minute ausführen
                main();
            }, 60000);
            main();
        },
    });

    AdapterStarted = false;

    adapter = new utils.Adapter(options);

    //adapter.log.debug('Starting Adapter')

    adapter.on('message', async obj => {
        adapter.log.debug(`M 0: received message: ${JSON.stringify(obj)}`);

        if (obj && obj.command === 'send') {
            adapter.log.debug('M 0.1 received send command!');
            await processMessage(obj);
            adapter.log.debug('M 1.9.9 after process message');
            //let setup = await processCountdowns()
            adapter.log.debug('M3 Clean Results');
            await cleanresults();

            adapter.log.debug('M4 Update HTML and JSON table');
            await updateCountdownTable();
            adapter.log.debug('M4.1 Updated HTML and JSON table');

            adapter.log.debug('M5. Done');
        }
    });

    adapter.on(`unload`, callback => {
        adapter.log.debug(`5. Stopping countdown adapter!`);
        clearInterval(Interval);
        callback && callback();
        //callback();
    });

    return adapter;
}

function main() {
    adapter.log.debug('0 Main');
    processCountdowns();
}

async function processCountdowns() {
    if (AdapterStarted == false) {
        await getVariableTranslation();
        adapter.log.debug('0.2 delete countdowns for a clean start');
        await deleteAllCountdowns();
        AdapterStarted = true;
    }
    adapter.log.debug('1 Loop setup');

    await loopsetup();
    adapter.log.debug('1.9 after loop setup');

    adapter.log.debug('2 Clean Results');
    await cleanresults();

    adapter.log.debug('3 Update HTML and JSON table');
    await updateCountdownTable();
    adapter.log.debug('3.2 Updated HTML and JSON table');

    adapter.log.debug('4. Done');
    //adapter.terminate ? adapter.terminate('5. Stopping adapter') : process.exit(0);
}

async function deleteAllCountdowns() {
    await Promise.all([
        //adapter.deleteDeviceAsync('countdowns')
        adapter.delObjectAsync('countdowns', { recursive: true }),
    ]);
}

async function deleteObsoleteCountdown(countName) {
    return new Promise(function (resolve) {
        adapter.getObjectAsync(`setup.${countName}`, async function (err, state) {
            //check if setup is still existing

            if (state === null && typeof state === 'object') {
                //if not - delete results
                await deleteCountdownResults(countName);
                resolve('done');
            } else {
                resolve('done');
            }
        });
    });
}

async function cleanresults(CountName) {
    adapter.log.debug('2.1 Starting cleaning countdowns in setup');
    return new Promise(function (resolve) {
        // clean results when a setup is deleted
        if (CountName == null) {
            // function started without parameter from normal loop
            adapter.getChannelsOf('countdowns', async function (err, result) {
                for (const channel of result) {
                    await deleteObsoleteCountdown(channel.common.name);
                }
                adapter.log.debug('2.4 Cleaned results');
                resolve('done');
            });
        } else {
            // function started with parameter Name - not necessary yet
            resolve('done');
        }
    });
}

async function deleteCountdownResults(CountName) {
    await Promise.all([adapter.deleteChannelAsync('countdowns', CountName)]);
    adapter.log.debug(`Deleted details for countdown ${CountName}`);
    return CountName;
}

async function deleteCountdownSetup(CountName) {
    await Promise.all([adapter.deleteStateAsync('setup', '', CountName)]);
    adapter.log.debug(`Deleted setup for countdown ${CountName}`);
    return CountName;
}

async function loopsetup() {
    adapter.log.debug('1.1 Start Loop Setup');

    return new Promise(function (resolve) {
        adapter.getStatesOf('setup', async function (error, result) {
            for (const id1 of result) {
                adapter.log.debug(`1.2 Setup Entries found: ${id1.common.name}`);
                await getStatesOfObj(id1.common.name);
            }
            resolve('done');
        });
    });
}

async function getStatesOfObj(name) {
    return new Promise(function (resolve) {
        adapter.getState(`setup.${name}`, async function (err, state) {
            //prüfen ob Device schon vorhanden ist
            await checkifCountdownExists(name, state.val);
            resolve('done');
        });
    });
}

async function checkifCountdownExists(name, state) {
    return new Promise(function (resolve) {
        adapter.log.debug(`1.3 check if countdown objects${name} exists`);
        adapter.getObject(`countdowns.${name}.name`, async function (err1, result1) {
            if (result1 === null && typeof result1 === 'object') {
                const CountName = name;
                await createObjects(CountName);
                adapter.getState(`setup.${CountName}`, async function (err, state1) {
                    if (state1 && state1.val) {
                        await createCountdownData(name, state1.val);
                        adapter.log.debug(` 1.6-2 Created Countdown ${CountName}`);
                        resolve('done');
                    } else {
                        const CountName = name;
                        adapter.log.error(`1.6-3 Date in setup is invalid for countdown ${CountName}`);
                        resolve('done');
                    }
                });
            } else {
                await createCountdownData(name, state);
                adapter.log.debug(` 1.6.6 Updated Countdown ${name}`);
                resolve('done');
            }
        });
    });
}

function getVariableTranslation() {
    let language = '';
    return new Promise(function (resolve) {
        adapter.getForeignObject('system.config', (err, systemConfig) => {
            language = systemConfig.common.language;
            translateObject = a.transLate(language);
            adapter.log.debug('0.1 Received translations');
            resolve('done');
        });
    });
}

async function createCountdownData(CountName, CountDate) {
    adapter.log.debug(
        `1.4 Updating countdown objects for countdown ${CountName}   with value ${JSON.stringify(CountDate)}`,
    );

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async function (resolve) {
        let repeatCycle = '';
        // check if a "repeat cycle" was added
        let SearchForCycle = CountDate.indexOf('+');
        if (SearchForCycle != -1) {
            repeatCycle = CountDate.slice(SearchForCycle + 1, CountDate.length);
            CountDate = CountDate.slice(0, SearchForCycle);
        }
        //adapter.log.debug('Repeat Cycle for ' + CountName + ' is: ' +  repeatCycle)

        let countUp = false;
        // check if a "countup" was added
        SearchForCycle = CountDate.indexOf('#');
        if (SearchForCycle != -1) {
            countUp = true;
            //CountDate = CountDate.slice(0,SearchForCycle)
            adapter.log.debug(`1.4.1: CountUp active for ${CountName}`);
        }

        let newdate = moment(CountDate, 'DD.MM.YYYY HH:mm:ss').toDate();

        let newdatelocal;
        switch (adapter.config.dateFormat) {
            case 'EuropeDot':
                newdatelocal = moment(newdate).local().format('DD.MM.YYYY HH:mm');
                break;
            case 'EuropeMinus':
                newdatelocal = moment(newdate).local().format('DD-MM-YYYY HH:mm');
                break;
            case 'USDot':
                newdatelocal = moment(newdate).local().format('MM.DD.YYYY HH:MM');
                break;
            case 'USMinuts':
                newdatelocal = moment(newdate).local().format('MM-DD-YYYY HH:MM');
                break;
            case 'YearFirst':
                newdatelocal = moment(newdate).local().format('YYYY-MM-DD HH:mm');
                break;
            default:
                newdatelocal = moment(newdate).local().format('DD.MM.YYYY HH:mm');
        }

        let now = moment(new Date()); //todays date
        let years;
        let restDate;
        let months;
        let days;
        let hours;
        let minutes;

        if (!countUp) {
            // normal countdown
            years = now.diff(newdate, 'years', false) * -1;
            restDate = moment(newdate).subtract(years, 'year');
            months = now.diff(restDate, 'months', false) * -1;
            restDate = moment(restDate).subtract(months, 'month');

            days = now.diff(restDate, 'days', false) * -1;
            restDate = moment(restDate).subtract(days, 'days');
            hours = now.diff(restDate, 'hours', false) * -1;
            restDate = moment(restDate).subtract(hours, 'hours');
            minutes = now.diff(restDate, 'minutes', false) * -1;
        } else {
            //Count Up
            let tempNow = moment(now, 'DD.MM.YYYY HH:mm:ss').toDate();
            let upDate = moment(newdate);
            years = upDate.diff(tempNow, 'years', false) * -1;
            restDate = moment(tempNow).subtract(years, 'year');
            months = upDate.diff(restDate, 'months', false) * -1;
            restDate = moment(restDate).subtract(months, 'month');

            days = upDate.diff(restDate, 'days', false) * -1;
            restDate = moment(restDate).subtract(days, 'days');
            hours = upDate.diff(restDate, 'hours', false) * -1;
            restDate = moment(restDate).subtract(hours, 'hours');
            minutes = upDate.diff(restDate, 'minutes', false) * -1;
        }

        storagename = CountName;
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'name' }, { val: CountName, ack: true });
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'endDate' },
            { val: newdatelocal, ack: true },
        );

        if (now.diff(newdate) >= 0 && !countUp) {
            adapter.log.debug(`1.4.2 Countdown in the past - ${CountName}`);

            if (repeatCycle != '') {
                // calculate new end date and write it into setup - countdown will then be updated in the next update cycle

                // check if repeat cycle contains a number

                if (hasNumber(repeatCycle)) {
                    // @ts-expect-error object possible null - MUST BE FIXED
                    let repeatNumber = Number(repeatCycle.match(/\d+/g).map(Number));
                    if (repeatNumber != null) {
                        let repeatType = repeatCycle.slice(repeatNumber.toString().length, repeatCycle.length);
                        if (repeatType != '') {
                            let newDateRepeat = newdate;

                            switch (repeatType) {
                                case 'Y':
                                    newDateRepeat = new Date(
                                        newdate.getFullYear() + repeatNumber,
                                        newdate.getMonth(),
                                        newdate.getDate(),
                                        newdate.getHours(),
                                        newdate.getMinutes(),
                                    );
                                    break;
                                case 'M':
                                    newDateRepeat = new Date(
                                        newdate.getFullYear(),
                                        newdate.getMonth() + repeatNumber,
                                        newdate.getDate(),
                                        newdate.getHours(),
                                        newdate.getMinutes(),
                                    );
                                    break;
                                case 'D':
                                    newDateRepeat = new Date(
                                        newdate.getFullYear(),
                                        newdate.getMonth(),
                                        newdate.getDate() + repeatNumber,
                                        newdate.getHours(),
                                        newdate.getMinutes(),
                                    );
                                    break;
                                case 'H':
                                    newDateRepeat = new Date(
                                        newdate.getFullYear(),
                                        newdate.getMonth(),
                                        newdate.getDate(),
                                        newdate.getHours() + repeatNumber,
                                        newdate.getMinutes(),
                                    );
                                    break;
                                case 'm':
                                    newDateRepeat = new Date(
                                        newdate.getFullYear(),
                                        newdate.getMonth(),
                                        newdate.getDate(),
                                        newdate.getHours(),
                                        newdate.getMinutes() + repeatNumber,
                                    );
                                    break;
                                default:
                                    adapter.log.error(`Repeat Cycle ${repeatCycle} is invalid!`);
                            }
                            let newDateString =
                                `${moment(newDateRepeat).format('DD')}.${moment(newDateRepeat).format('MM')}.${moment(
                                    newDateRepeat,
                                ).format('YYYY')} ${moment(newDateRepeat).format('HH')}:${moment(newDateRepeat).format(
                                    'mm',
                                )}:00` + `+${repeatCycle}`;
                            adapter.setState(
                                { device: 'setup', state: storagename },
                                { val: newDateString, ack: true },
                            );
                        } else {
                            adapter.log.error(`Repeat Cycle ${repeatCycle} is invalid!`);
                        }
                    } else {
                        adapter.log.error(`Repeat Cycle ${repeatCycle} is invalid!`);
                    }
                } else {
                    adapter.log.error(`Repeat cycle ${repeatCycle} is invalid - Layout is e.g. 1M for 1 month.`);
                }
            } else {
                // Countdown reached now -> disable countdown
                adapter.setState({ device: 'countdowns', channel: storagename, state: 'years' }, { val: 0, ack: true });
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'months' },
                    { val: 0, ack: true },
                );
                adapter.setState({ device: 'countdowns', channel: storagename, state: 'days' }, { val: 0, ack: true });
                adapter.setState({ device: 'countdowns', channel: storagename, state: 'hours' }, { val: 0, ack: true });
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'minutes' },
                    { val: 0, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'inWordsShort' },
                    { val: '', ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'inWordsLong' },
                    { val: '', ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'reached' },
                    { val: true, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'repeatEvery' },
                    { val: '', ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'totalHours' },
                    { val: 0, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'totalDays' },
                    { val: 0, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'totalWeeks' },
                    { val: 0, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'totalMonths' },
                    { val: 0, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'totalYears' },
                    { val: 0, ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'totalJson' },
                    { val: '', ack: true },
                );
                adapter.setState(
                    { device: 'countdowns', channel: storagename, state: 'fullJson' },
                    { val: '', ack: true },
                );

                if (adapter.config.autodelete) {
                    await deleteCountdownSetup(CountName);
                    await deleteCountdownResults(CountName);
                }
            }
            resolve('done');
        } else {
            // Countdown not reached -> update values
            adapter.log.debug(`1.4.3 Countdown in the future - ${CountName}`);

            let CountDowninWordsShort = '';
            let CountDowninWordsLong = '';

            //years
            if (years != 0) {
                if (years > 1) {
                    CountDowninWordsLong = `${years} ${translateObject.textYears}`;
                    CountDowninWordsShort = years + translateObject.textYearsShort;
                } else if (years == 1) {
                    CountDowninWordsLong = `${years} ${translateObject.textYear}`;
                    CountDowninWordsShort = years + translateObject.textYearsShort;
                }
            }

            //months
            if (months != 0 || years != 0) {
                if (CountDowninWordsLong != '') {
                    CountDowninWordsLong += ' ';
                    CountDowninWordsShort += ' ';
                }

                if (months > 1) {
                    CountDowninWordsLong += `${months} ${translateObject.textMonths}`;
                    CountDowninWordsShort += months + translateObject.textMonthsShort;
                } else if (months == 1) {
                    CountDowninWordsLong += `${months} ${translateObject.textMonth}`;
                    CountDowninWordsShort += months + translateObject.textMonthsShort;
                }
            }

            //days
            if (days != 0 || months != 0 || years != 0) {
                if (CountDowninWordsLong != '') {
                    CountDowninWordsLong += ' ';
                    CountDowninWordsShort += ' ';
                }
                if (days > 1) {
                    CountDowninWordsLong += `${days} ${translateObject.textDays}`;
                    CountDowninWordsShort += days + translateObject.textDaysShort;
                } else if (days == 1) {
                    CountDowninWordsLong += `${days} ${translateObject.textDay}`;
                    CountDowninWordsShort += days + translateObject.textDaysShort;
                }
            }

            //hours
            if (hours != 0 && years == 0 && months == 0 && days == 0) {
                if (CountDowninWordsLong != '') {
                    CountDowninWordsLong += ' ';
                    CountDowninWordsShort += ' ';
                }
                if (hours > 1) {
                    CountDowninWordsLong += `${hours} ${translateObject.textHours}`;
                    CountDowninWordsShort += hours + translateObject.textHoursShort;
                } else if (hours == 1) {
                    CountDowninWordsLong += `${hours} ${translateObject.textHour}`;
                    CountDowninWordsShort += hours + translateObject.textHoursShort;
                }
            }

            //minutes
            if (minutes != 0 && years == 0 && months == 0 && days == 0) {
                if (CountDowninWordsLong != '') {
                    CountDowninWordsLong += ' ';
                    CountDowninWordsShort += ' ';
                }
                CountDowninWordsShort += minutes + translateObject.textMinutesShort;
                if (minutes > 1) {
                    CountDowninWordsLong += `${minutes} ${translateObject.textMinutes}`;
                } else {
                    CountDowninWordsLong += `${minutes} ${translateObject.textMinute}`;
                }
            }

            //adapter.log.debug('vor speichern1: ' + months)

            let totalDays;
            let totalHours;
            let totalWeeks;
            let totalMonths;
            let totalYears;

            if (!countUp) {
                // Normal Countdown
                totalDays = mydiff(Date(), newdate, 'days');
                totalHours = mydiff(Date(), newdate, 'hours');
                totalWeeks = mydiff(Date(), newdate, 'weeks');
                totalMonths = mydiff(Date(), newdate, 'months');
                totalYears = mydiff(Date(), newdate, 'years');
                adapter.log.debug(`TOTAL YEARS: ${totalYears}`);
            } else {
                // CountUp
                totalDays = mydiff(newdate, Date(), 'days');
                totalHours = mydiff(newdate, Date(), 'hours');
                totalWeeks = mydiff(newdate, Date(), 'weeks');
                totalMonths = mydiff(newdate, Date(), 'months');
                totalYears = mydiff(newdate, Date(), 'years');
            }

            await updateObjects(
                years,
                months,
                days,
                hours,
                minutes,
                CountDowninWordsShort,
                CountDowninWordsLong,
                totalDays,
                totalHours,
                totalWeeks,
                totalMonths,
                totalYears,
                repeatCycle,
                countUp,
            );

            adapter.log.debug(`1.5 Updated objects for ${CountName}`);

            resolve('done');
        }
    });
}

async function updateObjects(
    years,
    months,
    days,
    hours,
    minutes,
    CountDowninWordsShort,
    CountDowninWordsLong,
    totalDays,
    totalHours,
    totalWeeks,
    totalMonths,
    totalYears,
    repeatCycle,
    countUp,
) {
    let totalJsonData = [];

    let tempTable = {};

    tempTable[translateObject.textYears] = totalYears;
    tempTable[translateObject.textMonths] = totalMonths;
    tempTable[translateObject.textWeeks] = totalWeeks;
    tempTable[translateObject.textDays] = totalDays;
    tempTable[translateObject.textHours] = totalHours;

    totalJsonData.push(tempTable);
    let totalJson = JSON.stringify(totalJsonData);

    let fullJsonData = {
        years: years,
        months: months,
        days: days,
        hours: hours,
        minutes: minutes,
        inWords: {
            short: CountDowninWordsShort,
            long: CountDowninWordsLong,
        },
        total: {
            days: totalDays,
            hours: totalHours,
            weeks: totalWeeks,
            months: totalMonths,
            years: totalYears,
        },
        repeatCycle: repeatCycle,
        countUp: countUp,
    };
    let fullJson = JSON.stringify(fullJsonData);

    adapter.log.debug(`TOTAL YEARS1: ${totalYears}`);

    await Promise.all([
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'years' }, { val: years, ack: true }),
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'months' }, { val: months, ack: true }),
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'days' }, { val: days, ack: true }),
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'hours' }, { val: hours, ack: true }),
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'minutes' }, { val: minutes, ack: true }),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'inWordsShort' },
            { val: CountDowninWordsShort, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'inWordsLong' },
            { val: CountDowninWordsLong, ack: true },
        ),
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'reached' }, { val: false, ack: true }),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'totalDays' },
            { val: totalDays, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'totalHours' },
            { val: totalHours, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'totalWeeks' },
            { val: totalWeeks, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'totalMonths' },
            { val: totalMonths, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'totalYears' },
            { val: totalYears, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'totalJson' },
            { val: totalJson, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'fullJson' },
            { val: fullJson, ack: true },
        ),
        adapter.setState(
            { device: 'countdowns', channel: storagename, state: 'repeatEvery' },
            { val: repeatCycle, ack: true },
        ),
        adapter.setState({ device: 'countdowns', channel: storagename, state: 'countUp' }, { val: countUp, ack: true }),
    ]);
}

function hasNumber(myString) {
    // function to check if string contains a number
    return /\d/.test(myString);
}

async function processMessage(obj) {
    adapter.log.debug('M 1: Start processing Message');
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async function (resolve) {
        let year = 0;
        let month = '0';
        let day = '0';
        let hour = '01';
        let minute = '01';
        let name = obj.message.name;
        let erroroccured = false;

        if (typeof obj.message.date != 'undefined') {
            let repeatCycle = '';
            adapter.log.debug(`M 1.1: object message: ${obj.message.date}`);
            if (obj.message.date != '') {
                let processingDate = obj.message.date;
                // check if a "repeat cycle" was added
                let SearchForCycle = obj.message.date.indexOf('+');
                if (SearchForCycle != -1) {
                    repeatCycle = obj.message.date.slice(SearchForCycle, obj.message.date.length);
                    processingDate = processingDate.slice(0, SearchForCycle);
                }

                SearchForCycle = obj.message.date.indexOf('#');
                let countUp = false;
                if (SearchForCycle != -1) {
                    countUp = true;
                    processingDate = processingDate.slice(0, SearchForCycle);
                }

                //adapter.log.debug('TEMP processingDate: ' + processingDate)
                //adapter.log.debug('setup: ' + adapter.config.dateFormat)

                let messageDate = new Date();
                switch (adapter.config.dateFormat) {
                    case 'EuropeDot':
                        messageDate = moment(processingDate, 'DD.MM.YYYY HH:mm').toDate();
                        break;
                    case 'EuropeMinus':
                        messageDate = moment(processingDate, 'DD-MM-YYYY HH:mm').toDate();
                        break;
                    case 'USDot':
                        messageDate = moment(processingDate, 'MM.DD.YYYY HH:MM').toDate();
                        break;
                    case 'USMinuts':
                        messageDate = moment(processingDate, 'MM-DD-YYYY HH:MM').toDate();
                        break;
                    case 'YearFirst':
                        messageDate = moment(processingDate, 'YYYY-MM-DD HH:mm').toDate();
                        break;
                    default:
                        messageDate = moment(processingDate, 'DD.MM.YYYY HH:mm').toDate();
                }

                let messageDateString = `${moment(messageDate).format('DD')}.${moment(messageDate).format(
                    'MM',
                )}.${moment(messageDate).format('YYYY')} ${moment(messageDate).format('HH')}:${moment(
                    messageDate,
                ).format('mm')}:00`;

                //adapter.log.debug(' messageDateString: ' + messageDateString)
                //adapter.log.debug(' messageDate: ' + messageDate)

                //adapter.log.debug('CHECK IF VALID)')
                if (moment(messageDateString, 'DD.MM.YYYY HH:mm:ss', true).isValid()) {
                    //adapter.log.debug('VALID)')

                    messageDateString += repeatCycle;
                    if (countUp) {
                        messageDateString += '#';
                    }
                    await createSetupEntryCompleteDate(messageDateString, name);
                } else {
                    // invalid date
                    //adapter.log.debug('INVALID date: '+  moment(messageDateString, 'DD.MM.YYYY HH:mm:ss',true))

                    adapter.log.error(`M 1.2: Date for countdown ${name} is invalid: ${obj.message.date}`);
                }
            }
        } else if (typeof obj.message.addminutes != 'undefined') {
            if (obj.message.addminutes != '' && obj.message.addminutes != '0' && parseInt(obj.message.addminutes)) {
                let now = new Date(); //todays date
                let toAdd = Number(obj.message.addminutes);
                let newDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes() + toAdd,
                );
                let messageDateString = `${moment(newDate).format('DD')}.${moment(newDate).format('MM')}.${moment(
                    newDate,
                ).format('YYYY')} ${moment(newDate).format('HH')}:${moment(newDate).format('mm')}:00`;

                await createSetupEntryCompleteDate(messageDateString, name);
            } else {
                adapter.log.error(`M 1.3: ${name}: Adding ${obj.message.addminutes} is invalid`);
            }
        } else if (typeof obj.message.addhours != 'undefined') {
            if (obj.message.addhours != '' && obj.message.addhours != '0' && parseInt(obj.message.addhours)) {
                let now = new Date(); //todays date
                let toAdd = Number(obj.message.addhours);
                let newDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    now.getHours() + toAdd,
                    now.getMinutes(),
                );
                let messageDateString = `${moment(newDate).format('DD')}.${moment(newDate).format('MM')}.${moment(
                    newDate,
                ).format('YYYY')} ${moment(newDate).format('HH')}:${moment(newDate).format('mm')}:00`;

                await createSetupEntryCompleteDate(messageDateString, name);
            } else {
                adapter.log.error(`M 1.3: ${name}: Adding ${obj.message.addhours} is invalid`);
            }
        } else if (typeof obj.message.adddays != 'undefined') {
            if (obj.message.adddays != '' && obj.message.adddays != '0' && parseInt(obj.message.adddays)) {
                let now = new Date(); //todays date
                let toAdd = Number(obj.message.adddays);
                let newDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + toAdd,
                    now.getHours(),
                    now.getMinutes(),
                );

                let messageDateString = `${moment(newDate).format('DD')}.${moment(newDate).format('MM')}.${moment(
                    newDate,
                ).format('YYYY')} ${moment(newDate).format('HH')}:${moment(newDate).format('mm')}:00`;

                await createSetupEntryCompleteDate(messageDateString, name);
            } else {
                adapter.log.error(`M 1.3: ${name}: Adding ${obj.message.adddays} is invalid`);
            }
        } else if (typeof obj.message.addmonths != 'undefined') {
            if (obj.message.addmonths != '' && obj.message.addmonths != '0' && parseInt(obj.message.addmonths)) {
                let now = new Date(); //todays date
                let toAdd = Number(obj.message.addmonths);

                let newDate = new Date(
                    now.getFullYear(),
                    now.getMonth() + toAdd,
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                );

                let messageDateString = `${moment(newDate).format('DD')}.${moment(newDate).format('MM')}.${moment(
                    newDate,
                ).format('YYYY')} ${moment(newDate).format('HH')}:${moment(newDate).format('mm')}:00`;

                await createSetupEntryCompleteDate(messageDateString, name);
            } else {
                adapter.log.error(`M 1.3: ${name}: Adding ${obj.message.addmonths} is invalid`);
            }
        } else if (typeof obj.message.addyears != 'undefined') {
            if (obj.message.addyears != '' && obj.message.addyears != '0' && parseInt(obj.message.addyears)) {
                let now = new Date(); //todays date
                let toAdd = Number(obj.message.addyears);
                let newDate = new Date(
                    now.getFullYear() + toAdd,
                    now.getMonth(),
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                );
                let messageDateString = `${moment(newDate).format('DD')}.${moment(newDate).format('MM')}.${moment(
                    newDate,
                ).format('YYYY')} ${moment(newDate).format('HH')}:${moment(newDate).format('mm')}:00`;

                await createSetupEntryCompleteDate(messageDateString, name);
            } else {
                adapter.log.error(`M 1.3: ${name}: Adding ${obj.message.addyears} is invalid`);
            }
        } else if (countProperties(obj.message) >= 2 && typeof obj.message.year != 'undefined') {
            if (obj.message.year != '') {
                let messageyeartring = obj.message.year;
                // let messageyearInt = 0;
                // if ((messageyearInt = parseInt(messageyeartring))) {
                if (parseInt(messageyeartring)) {
                    // is int
                    year = messageyeartring;
                } else {
                    adapter.log.error('M 1.4: Could not create countdown as year value is no int!');
                    erroroccured = true;
                }
                if (year == 0 || year > 2100) {
                    adapter.log.error(`M 1.4: Could not create countdown as year value is not valid: ${year}`);
                    erroroccured = true;
                }
            }

            if (obj.message.month != '') {
                let messagemonthString = '';
                let messageMonthInt = 0;
                messagemonthString = obj.message.month.replace(/[^0-9]+/g, '');
                if ((messageMonthInt = parseInt(messagemonthString))) {
                    // is int
                    if (messageMonthInt <= 9) {
                        month = `0${messageMonthInt}`;
                    } else {
                        month = messageMonthInt.toString();
                    }
                    if (messageMonthInt == 0 || messageMonthInt > 12) {
                        adapter.log.error(
                            `M 1.4: Could not create countdown as month value is not valid: ${messageMonthInt}`,
                        );
                        erroroccured = true;
                    }
                } else {
                    adapter.log.error(
                        `M 1.4: Could not create countdown as month value is no int! Value: ${messageMonthInt}`,
                    );
                    erroroccured = true;
                }
            }
            if (obj.message.day != '') {
                let messagDayString = '';
                let messageDayInt = 0;
                messagDayString = obj.message.day.replace(/^0+/, '');
                if ((messageDayInt = parseInt(messagDayString))) {
                    // is
                    if (messageDayInt <= 9) {
                        day = `0${messageDayInt}`;
                    } else {
                        day = messageDayInt.toString();
                    }
                } else {
                    adapter.log.error('M 1.4: Could not create countdown as day value is no int!');
                    erroroccured = true;
                }
                if (messageDayInt == 0 || messageDayInt > 31) {
                    adapter.log.error(`M 1.4: Could not create countdown as day value is not valid: ${messageDayInt}`);
                    erroroccured = true;
                }
            }
            if (obj.message.hour != '') {
                let messagHourString = '';
                let messageHourInt = 0;
                messagHourString = obj.message.hour.replace(/^0+/, '');

                if ((messageHourInt = parseInt(messagHourString))) {
                    // is int
                    if (messageHourInt <= 9) {
                        hour = `0${messageHourInt}`;
                    } else {
                        hour = messageHourInt.toString();
                    }
                } else {
                    hour = '00';
                }
                if (messageHourInt > 24) {
                    adapter.log.error(
                        `M 1.4: Could not create countdown as hour value is not valid: ${messageHourInt}`,
                    );
                    erroroccured = true;
                }
            }
            if (obj.message.minute != '') {
                let messagMinuteString = '';
                let messageMinuteInt = 0;
                messagMinuteString = obj.message.minute.replace(/^0+/, '');

                if ((messageMinuteInt = parseInt(messagMinuteString))) {
                    // is int
                    if (messageMinuteInt <= 9) {
                        minute = `0${messageMinuteInt}`;
                    } else {
                        minute = messageMinuteInt.toString();
                    }
                } else {
                    minute = '00';
                }
                if (messageMinuteInt > 60) {
                    adapter.log.error(
                        `M 1.4: Could not create countdown as minute value is not valid: ${messageMinuteInt}`,
                    );
                    erroroccured = true;
                }
            }
            //adapter.log.debug('Error occured: ' + erroroccured)

            if (erroroccured == false) {
                adapter.log.debug('M 1.5: Creating Setup Entry');
                //adapter.log.debug('Values: day: ' + day + ' month: ' + month + ' year: ' + year + ' hour: ' + hour + ' minute: ' + minute)
                if (day == '0' || year == 0 || month == '0') {
                    adapter.log.error(`M 1.5.1: Date component invalid. Day: ${day}, Month: ${month}, Year: ${year}`);
                } else {
                    await createSetupEntry(day, month, year, hour, minute, name);
                }
            }
        } else if (countProperties(obj.message) == 1) {
            adapter.log.info(`M 1.6. Delete countdown: ${name}`);
            await deleteCountdownSetup(name);
            await deleteCountdownResults(name);
            adapter.log.info(`M 1.6.1 Deleted countdown: ${name}`);
        } else {
            adapter.log.error(
                `M 1.1:  Wrong parameters for: ${name}, Parameter count: ${countProperties(obj.message)}`,
            );
        }
        adapter.log.debug('M 1.9: Finished processing Message');
        resolve('done');
    });
}

async function createSetupEntry(day, month, year, hour, minute, name) {
    let datestring = `${day}.${month}.${year} ${hour}:${minute}:00`;
    adapter.log.debug(`M 1.6: Creating setup entry for date ${datestring}`);

    const obj_new = await adapter.getObjectAsync(`setup.${name}`);
    if (obj_new != null) {
        await adapter.setStateAsync({ device: 'setup', state: name }, { val: datestring, ack: true });
        adapter.log.debug(`M 1.7-1: Setup Entry updated for countdown: ${name}`);

        //TEMP

        await checkifCountdownExists(name, datestring);
        adapter.log.debug(`M 1.8-1: Object Entry created  for countdown: ${name}`);
    } else {
        await adapter.createStateAsync('', 'setup', name, {
            read: true,
            write: true,
            name: name,
            type: 'string',
            def: datestring,
            role: 'value',
        });
        adapter.log.debug(`M 1.7-2: Setup Entry created  for countdown: ${name}`);

        await checkifCountdownExists(name, datestring);
        adapter.log.debug(`M 1.8-2: Object Entry created  for countdown: ${name}`);
    }
}

async function createSetupEntryCompleteDate(messageDateString, name) {
    const obj_new = await adapter.getObjectAsync(`setup.${name}`);
    if (obj_new != null) {
        await adapter.setStateAsync({ device: 'setup', state: name }, { val: messageDateString, ack: true });
        adapter.log.debug(`M 1.7-3: Setup Entry updated for countdown: ${name}`);

        await checkifCountdownExists(name, messageDateString);
        adapter.log.debug(`M 1.8-3: Object Entry created  for countdown: ${name}`);
    } else {
        await adapter.createStateAsync('', 'setup', name, {
            read: true,
            write: true,
            name: name,
            type: 'string',
            def: messageDateString,
            role: 'value',
        });
        adapter.log.debug(`M 1.7-4: Setup Entry created   for countdown: ${name}`);
    }

    await checkifCountdownExists(name, messageDateString);
    adapter.log.debug(`M 1.8-4: Object Entry created  for countdown: ${name}`);
}

async function loadValuesforTable() {
    countdownData = [];

    return new Promise(function (resolve) {
        adapter.getChannelsOf('countdowns', async function (error, result) {
            for (const id1 of result) {
                let tempTable = {};
                let countName = await adapter.getStateAsync(`countdowns.${id1.common.name}.name`);
                tempTable[translateObject.headerName] = countName.val;

                if (adapter.config.inWordsShort) {
                    let inWordsShort = await adapter.getStateAsync(`countdowns.${id1.common.name}.inWordsShort`);
                    tempTable[translateObject.headerCountdown] = inWordsShort.val;
                }

                if (adapter.config.inWordsLong) {
                    let inWordsLong = await adapter.getStateAsync(`countdowns.${id1.common.name}.inWordsLong`);
                    tempTable[`${translateObject.headerCountdown} `] = inWordsLong.val;
                }

                if (adapter.config.totalNoOfDays) {
                    let totalDays = await adapter.getStateAsync(`countdowns.${id1.common.name}.totalDays`);
                    tempTable[`${translateObject.textDays} `] = totalDays.val;
                }

                if (adapter.config.totalNoOfHours) {
                    let totalHours = await adapter.getStateAsync(`countdowns.${id1.common.name}.totalHours`);
                    tempTable[`${translateObject.textHours} `] = totalHours.val;
                }

                if (adapter.config.totalNoOfWeeks) {
                    let totalWeeks = await adapter.getStateAsync(`countdowns.${id1.common.name}.totalWeeks`);
                    tempTable[`${translateObject.textWeeks} `] = totalWeeks.val;
                }

                // Always fetch endDate for sorting purposes
                let endDate = await adapter.getStateAsync(`countdowns.${id1.common.name}.endDate`);
                if (endDate && endDate.val) {
                    tempTable['_sortDate'] = endDate.val;
                }

                if (adapter.config.endDate && endDate && endDate.val) {
                    tempTable[`${translateObject.headerDate} `] = endDate.val;
                }
                countdownData.push(tempTable);
            }

            // Sort by date if enabled
            if (adapter.config.sortByDate) {
                // Determine the date format based on adapter configuration
                let dateFormat;
                switch (adapter.config.dateFormat) {
                    case 'EuropeDot':
                        dateFormat = 'DD.MM.YYYY HH:mm';
                        break;
                    case 'EuropeMinus':
                        dateFormat = 'DD-MM-YYYY HH:mm';
                        break;
                    case 'USDot':
                        dateFormat = 'MM.DD.YYYY HH:mm';
                        break;
                    case 'USMinuts':
                        dateFormat = 'MM-DD-YYYY HH:mm';
                        break;
                    case 'YearFirst':
                        dateFormat = 'YYYY-MM-DD HH:mm';
                        break;
                    default:
                        dateFormat = 'DD.MM.YYYY HH:mm';
                }

                countdownData.sort((a, b) => {
                    const dateA = moment(a['_sortDate'], dateFormat);
                    const dateB = moment(b['_sortDate'], dateFormat);
                    return dateA.diff(dateB);
                });
            }

            // Remove temporary sort field
            countdownData.forEach(item => delete item['_sortDate']);

            resolve('done');
        });
    });
}

async function updateCountdownTable() {
    await loadValuesforTable();

    await Promise.all([
        adapter.setState({ state: 'htmlContent' }, { val: tableify(countdownData), ack: true }),
        adapter.setState({ state: 'jsonContent' }, { val: JSON.stringify(countdownData), ack: true }),
    ]);
    adapter.log.debug(`3.1 Found ${countdownData.length} countdowns for JSON and HTML`);
}

async function createObjects(CountName) {
    //adapter.log.debug('Start creating Objects')
    await Promise.all([
        adapter.setObjectNotExistsAsync(`countdowns.${CountName}`, {
            common: {
                name: CountName,
            },
            type: 'channel',
            native: {},
        }),

        await localCreateState(`countdowns` + `.${CountName}.name`, 'name', CountName),
        await localCreateState(`countdowns` + `.${CountName}.reached`, 'reached', false),
        await localCreateState(`countdowns` + `.${CountName}.countUp`, 'countUp', false),
        await localCreateState(`countdowns` + `.${CountName}.years`, 'years', 0),
        await localCreateState(`countdowns` + `.${CountName}.months`, 'months', 0),
        await localCreateState(`countdowns` + `.${CountName}.days`, 'days', 0),
        await localCreateState(`countdowns` + `.${CountName}.hours`, 'hours', 0),
        await localCreateState(`countdowns` + `.${CountName}.minutes`, 'minutes', 0),
        await localCreateState(`countdowns` + `.${CountName}.inWordsLong`, 'inWordsLong', ''),
        await localCreateState(`countdowns` + `.${CountName}.inWordsShort`, 'inWordsShort', ''),
        await localCreateState(`countdowns` + `.${CountName}.endDate`, 'endDate', ''),
        await localCreateState(`countdowns` + `.${CountName}.totalDays`, 'totalDays', 0),
        await localCreateState(`countdowns` + `.${CountName}.totalHours`, 'totalHours', 0),
        await localCreateState(`countdowns` + `.${CountName}.totalWeeks`, 'totalWeeks', 0),
        await localCreateState(`countdowns` + `.${CountName}.totalMonths`, 'totalMonths', 0),
        await localCreateState(`countdowns` + `.${CountName}.totalYears`, 'totalYears', 0),
        await localCreateState(`countdowns` + `.${CountName}.totalJson`, 'totalJson', ''),
        await localCreateState(`countdowns` + `.${CountName}.fullJson`, 'fullJson', ''),
        await localCreateState(`countdowns` + `.${CountName}.repeatEvery`, 'repeatEvery', ''),
    ]);
    adapter.log.debug('1.3.4: All states created');
}

function countProperties(obj) {
    let count = 0;

    for (let prop in obj) {
        // eslint-disable-next-line no-prototype-builtins
        if (obj.hasOwnProperty(prop)) {
            ++count;
        }
    }

    return count;
}

async function localCreateState(state, name, value) {
    //adapter.log.debug(`Create_state called for : ${state} with value : ${value}`);

    try {
        // Try to get details from state lib, if not use defaults. throw warning if states is not known in attribute list
        if (stateAttr[name] === undefined) {
            const warnMessage = `State attribute definition missing for ${name}`;
            if (warnMessages[name] !== warnMessage) {
                warnMessages[name] = warnMessage;
                adapter.log.warn(`State attribute definition missing for ${name}`);
            }
        }
        const writable = stateAttr[name] !== undefined ? stateAttr[name].write || false : false;
        const state_name = stateAttr[name] !== undefined ? stateAttr[name].name || name : name;
        const role = stateAttr[name] !== undefined ? stateAttr[name].role || 'state' : 'state';
        const type = stateAttr[name] !== undefined ? stateAttr[name].type || 'mixed' : 'mixed';
        const unit = stateAttr[name] !== undefined ? stateAttr[name].unit || '' : '';
        //adapter.log.debug(`Write value : ${writable}`);

        await adapter.setObjectNotExistsAsync(state, {
            type: 'state',
            common: {
                name: state_name,
                role: role,
                type: type,
                unit: unit,
                read: true,
                write: writable,
            },
            native: {},
        });

        // Ensure name changes are propagated
        await adapter.extendObjectAsync(state, {
            type: 'state',
            common: {
                name: state_name,
                type: type, // Also update types t solve log error's and  attribute changes
            },
        });

        // Only set value if input != null
        if (value !== null) {
            await adapter.setState(state, { val: value, ack: true });
        }

        // Subscribe on state changes if writable
        // writable && this.subscribeStates(state);
    } catch (error) {
        errorHandling('localCreateState', error);
    }
}

function errorHandling(codePart, error, suppressFrontendLog) {
    if (!suppressFrontendLog) {
        adapter.log.error(`[${codePart}] error: ${error.message}, stack: ${error.stack}`);
    }
    if (adapter.supportsFeature && adapter.supportsFeature('PLUGINS')) {
        const sentryInstance = adapter.getPluginInstance('sentry');
        if (sentryInstance) {
            sentryInstance.getSentryObject().captureException(error);
        }
    }
}

function mydiff(date1, date2, interval) {
    let second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24,
        week = day * 7;
    date1 = new Date(date1);
    date2 = new Date(date2);
    // for Month calculation
    let date1Moment = moment(new Date(date1));
    let date2Moment = moment(new Date(date2));
    let timediff = date2 - date1;
    if (isNaN(timediff)) {
        return NaN;
    }

    switch (interval) {
        case 'years':
            return date2Moment.diff(date1Moment, 'years', false);
        case 'months':
            return date2Moment.diff(date1Moment, 'months', false);
        case 'weeks':
            return Math.floor(timediff / week);
        case 'days':
            return Math.floor(timediff / day);
        case 'hours':
            return Math.floor(timediff / hour);
        case 'minutes':
            return Math.floor(timediff / minute);
        case 'seconds':
            return Math.floor(timediff / second);
        default:
            return undefined;
    }
}

// If started as allInOne/compact mode => return function to create instance
// @ts-expect-error to be checked
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
