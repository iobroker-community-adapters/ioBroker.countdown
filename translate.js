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
var textYear = '';
var textYears = '';
var textYearsShort = '';
var textMonth = '';
var textMonths = '';
var textMonthsShort = '';
var textDay = '';
var textDays = '';
var textDaysShort = '';
var textHour = '';
var textHours = '';
var textHoursShort = '';
var textMinute = '';
var textMinutes = '';
var textMinutesShort = '';
var textWeeks = '';

var headerCountdown = '';
var headerName = '';
var headerEndDate = '';
var headerDate = '';

module.exports = class A {
    transLate(language) {
        switch (language) {
            case 'de':
                textYear = 'Jahr';
                textYears = 'Jahre';
                textYearsShort = 'J';
                textMonth = 'Monat';
                textMonths = 'Monate';
                textMonthsShort = 'M';
                textDay = 'Tag';
                textDays = 'Tage';
                textDaysShort = 'T';
                textHour = 'Stunde';
                textHours = 'Stunden';
                textHoursShort = 'S';
                textMinute = 'Minute';
                textMinutes = 'Minuten';
                textMinutesShort = 'M';
                textWeeks = 'Wochen';
                headerCountdown = 'Countdown';
                headerName = 'Name';
                headerEndDate = 'Enddatum';
                headerDate = 'Datum';
                break;
            case 'en':
                textYear = 'Year';
                textYears = 'Years';
                textYearsShort = 'Y';
                textMonth = 'Month';
                textMonths = 'Months';
                textMonthsShort = 'M';
                textDay = 'Day';
                textDays = 'Days';
                textDaysShort = 'D';
                textHour = 'Hour';
                textHours = 'Hours';
                textHoursShort = 'H';
                textMinute = 'Minute';
                textMinutes = 'Minutes';
                textMinutesShort = 'M';
                textWeeks = 'Weeks';
                headerCountdown = 'Countdown';
                headerName = 'Name';
                headerEndDate = 'Enddate';
                headerDate = 'Date';
                break;
            case 'ru':
                textYear = 'Год';
                textYears = 'лет';
                textYearsShort = 'Y';
                textMonth = 'месяц';
                textMonths = 'месяцы';
                textMonthsShort = 'M';
                textDay = 'день';
                textDays = 'дней';
                textDaysShort = 'D';
                textHour = 'час';
                textHours = 'часов';
                textHoursShort = 'H';
                textMinute = 'минут';
                textMinutes = 'минут';
                textMinutesShort = 'M';
                textWeeks = 'Недели';
                headerCountdown = 'Отсчет';
                headerName = 'Имя';
                headerEndDate = 'конец';
                headerDate = 'Дата';
                break;
            case 'pt':
                textYear = 'ano';
                textYears = 'anos';
                textYearsShort = 'A';
                textMonth = 'mês';
                textMonths = 'meses';
                textMonthsShort = 'M';
                textDay = 'dia';
                textDays = 'dias';
                textDaysShort = 'D';
                textHour = 'hora';
                textHours = 'horas';
                textHoursShort = 'H';
                textMinute = 'minuto';
                textMinutes = 'minutos';
                textMinutesShort = 'M';
                textWeeks = 'Semanas';
                headerCountdown = 'Contagem';
                headerName = 'Nome';
                headerEndDate = 'Data de término';
                headerDate = 'Data';
                break;
            case 'nl':
                textYear = 'jaar';
                textYears = 'jaar';
                textYearsShort = 'J';
                textMonth = 'maand';
                textMonths = 'maanden';
                textMonthsShort = 'M';
                textDay = 'dag';
                textDays = 'dagen';
                textDaysShort = 'D';
                textHour = 'uur';
                textHours = 'uur';
                textHoursShort = 'H';
                textMinute = 'minuut';
                textMinutes = 'notulen';
                textMinutesShort = 'M';
                textWeeks = 'Weken';
                headerCountdown = 'Aftellen';
                headerName = 'Naam';
                headerEndDate = 'Vertaling';
                headerDate = 'Datum';
                break;
            case 'fr':
                textYear = 'année';
                textYears = 'années';
                textYearsShort = 'A';
                textMonth = 'mois';
                textMonths = 'mois';
                textMonthsShort = 'M';
                textDay = 'journée';
                textDays = 'journées';
                textDaysShort = 'J';
                textHour = 'heure';
                textHours = 'heures';
                textHoursShort = 'H';
                textMinute = 'minute';
                textMinutes = 'minutes';
                textMinutesShort = 'M';
                textWeeks = 'Semaines';
                headerCountdown = 'Compte à rebours';
                headerName = 'Nom';
                headerEndDate = 'Enddate';
                headerDate = 'Date';
                break;
            case 'it':
                textYear = 'anno';
                textYears = 'anni';
                textYearsShort = 'A';
                textMonth = 'mese';
                textMonths = 'mesi';
                textMonthsShort = 'M';
                textDay = 'giorno';
                textDays = 'giorni';
                textDaysShort = 'G';
                textHour = 'ora';
                textHours = 'ore';
                textHoursShort = 'O';
                textMinute = 'minuto';
                textMinutes = 'minuti';
                textMinutesShort = 'M';
                textWeeks = 'Settimane';
                headerCountdown = 'Conteggio';
                headerName = 'Nome';
                headerEndDate = 'Termine';
                headerDate = 'Data';
                break;
            case 'es':
                textYear = 'año';
                textYears = 'años';
                textYearsShort = 'A';
                textMonth = 'mes';
                textMonths = 'meses';
                textMonthsShort = 'M';
                textDay = 'día';
                textDays = 'dias';
                textDaysShort = 'D';
                textHour = 'hora';
                textHours = 'horas';
                textHoursShort = 'H';
                textMinute = 'minuto';
                textMinutes = 'minutos';
                textMinutesShort = 'M';
                textWeeks = 'Semanas';
                headerCountdown = 'Cuenta atrás';
                headerName = 'Nombre';
                headerEndDate = 'Fecha final';
                headerDate = 'Fecha';
                break;
            case 'pl':
                textYear = 'rok';
                textYears = 'lat';
                textYearsShort = 'R';
                textMonth = 'miesiąc';
                textMonths = 'miesięcy';
                textMonthsShort = 'M';
                textDay = 'dzień';
                textDays = 'dni';
                textDaysShort = 'D';
                textHour = 'godzina';
                textHours = 'godziny';
                textHoursShort = 'G';
                textMinute = 'minuta';
                textMinutes = 'minuty';
                textMinutesShort = 'M';
                textWeeks = 'Tydzień';
                headerCountdown = 'Countdown';
                headerName = 'Nazwa';
                headerEndDate = 'Data końcowa';
                headerDate = 'Data';
                break;
            case 'zh-cn':
                textYear = '年';
                textYears = '年份';
                textYearsShort = 'Y';
                textMonth = '月';
                textMonths = '个月';
                textMonthsShort = 'M';
                textDay = '天';
                textDays = '天';
                textDaysShort = 'D';
                textHour = '小时';
                textHours = '小时';
                textHoursShort = 'H';
                textMinute = '分钟';
                textMinutes = '分钟';
                textMinutesShort = 'M';
                textWeeks = '周';
                headerCountdown = '倒数';
                headerName = '姓名';
                headerEndDate = '日期';
                headerDate = '日期';
                break;
            default:
                textYear = 'Year';
                textYears = 'Years';
                textYearsShort = 'Y';
                textMonth = 'Month';
                textMonths = 'Months';
                textMonthsShort = 'M';
                textDay = 'Day';
                textDays = 'Days';
                textDaysShort = 'D';
                textHour = 'Hour';
                textHours = 'Hours';
                textHoursShort = 'H';
                textMinute = 'Minute';
                textMinutes = 'Minutes';
                textMinutesShort = 'M';
                textWeeks = 'Weeks';
                headerCountdown = 'Countdown';
                headerName = 'Name';
                headerEndDate = 'Enddate';
                headerDate = 'Date';
                break;
        }

        var translateObject = {};
        translateObject.textYear = textYear;
        translateObject.textYears = textYears;
        translateObject.textYearsShort = textYearsShort;

        translateObject.textMonth = textMonth;
        translateObject.textMonths = textMonths;
        translateObject.textMonthsShort = textMonthsShort;

        translateObject.textDay = textDay;
        translateObject.textDays = textDays;
        translateObject.textDaysShort = textDaysShort;

        translateObject.textHour = textHour;
        translateObject.textHours = textHours;
        translateObject.textHoursShort = textHoursShort;

        translateObject.textWeeks = textWeeks;

        translateObject.textMinute = textMinute;
        translateObject.textMinutes = textMinutes;
        translateObject.textMinutesShort = textMinutesShort;

        translateObject.headerCountdown = headerCountdown;
        translateObject.headerName = headerName;
        translateObject.textWeeks = textWeeks;
        translateObject.headerEndDate = headerEndDate;
        translateObject.headerDate = headerDate;

        return translateObject;
    }
};
