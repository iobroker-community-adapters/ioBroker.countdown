# ioBroker.countdown

## Countdowns anzeigen
Der Adapter stellt automatisch eine JSON-Tabelle und eine HTML-Tabelle zur Verfügung. Für JSON wähle das Widget „basic-table" aus. Wähle für den HTML-Code „basic - string (unescaped)" aus.

Es ist möglich, entweder den Kurztext oder den Langtext anzuzeigen.
![Logo](admin/countdown_json.png)

## Countdowns nach Datum sortieren
Standardmäßig werden Countdowns in der HTML- und JSON-Ausgabe in der Reihenfolge ihrer Erstellung angezeigt. Wenn die Countdowns chronologisch nach ihrem Enddatum sortiert werden sollen, kann die Option „Countdowns nach Datum sortieren" in den Adaptereinstellungen aktiviert werden. Dadurch werden alle Countdowns vom frühesten bis zum spätesten Datum sortiert.

## Countdowns hinzufügen
Es gibt verschiedene Möglichkeiten, Countdowns einzurichten:

* In den Adaptereinstellungen im Reiter „Countdown erstellen“ einen Countdown erstellen.
* Im Geräte-Setup einen manuellen Zustand erstellen. Der Name des Objekts ist der Alarmname und der Wert ist das Datum. Das Datum muss im Format „TT.MM.JJJJ HH:mm:ss“ vorliegen.
* Mit sendto einen Alarm erstellen. Dort können entweder die Komponenten (mindestens Jahr, Monat, Datum) oder eine Datumszeichenfolge gesendet werden. Für die Datumszeichenfolge kann man das Format im Setup des Adapters anpassen.
![Logo](admin/countdown_blocky.png)
* Mit sendto Tage, Monate und Jahre zum heutigen Datum hinzufügen. Sende daher bitte die Komponente „name“ und entweder „addminutes“, „addhours“, „adddays“, „addmonths“ oder „addyears“ als int-Wert.
![Logo](admin/countdown_blocky_add.png)

## So passen Sie Countdowns an
Countdowns können entweder in den Adaptereinstellungen oder mit sendto aktualisiert werden. Verwende einfach den gleichen Namen und sende ihn mit dem neuen Datum. Dadurch wird der Countdown aktualisiert.

## So löschen Sie Countdowns
Ein Countdown kann über die Adaptereinstellungen oder mit sendto gelöscht werden. Sende mit sendto nur den Namen an den Adapter und der Countdown wird automatisch gelöscht.

## Wiederholter Countdown
Wenn sich ein Countdown in einem definierten Zeitraum wieder holen soll (z. B.für Hochzeitstage), kann dies mit dem Countdownadapter gemacht werden. Fülle dazu entweder das Feld „Wiederholungszeitraum“ in den Einstellungen des Adapters aus, oder füge den Zeitraum nach dem Datum hinzu, wenn eine Countdown mit dem Typ „Datum“ erstellen. Ein sendTo würde für einen Countdown, der am 1. April 2020 enden und sich jedes Jahr wiederholen sollte, so aussehen:

sendTo("countdown.0", "send", {
   „name“: „Hochzeitstag“,
   "Datum": '01.04.2020 00:01+1J'
});

Parameter sind hier:
* Y: Jahre
* M: Monate
* D: Tage
* H: Stunden
* m: Minuten

## Zusammenzählen
Neu hinzugekommen ist die Funktion zum „Hochzählen“, also zum Zählen der Tage ab einem Datum in der Vergangenheit. Dies kann entweder im Adapter-Setup oder durch hinzufügen eines „#“ zu einer Datumszeichenfolge erfolgen, z. B.

sendTo("countdown.0", "send", {
   "name": 'Geburtsdatum',
   „Datum“: '01.04.2020 00:01#
});

## Verfügbare Objekte
|Datentyp|Beschreibung|
|:---:|:---:|
|Minuten|Minuten bis zum Ende des Countdowns (nicht die Summe!)|
|Stunden|Stunden bis zum Ende des Countdowns (nicht die Summe!)|
|Tage|Tage bis zum Ende des Countdowns (nicht die Summe!)|
|Monate|Monate bis zum Ende des Countdowns (nicht die Summe!)|
|Jahre|Jahre bis zum Ende des Countdowns (nicht die Summe!)|
|name|Countdown-Name|
|endDate|Enddatum des Countdowns – formatiert wie im Setup definiert|
|inWordsShort|Kombinierter Wert aus Minuten, Stunden,... – z.B. 1J 5M 4T|
|inWordsLong|Kombinierter Wert aus Minuten, Stunden,... – z.B. 1 Jahr 5 Monate 4 Tage|
|totalHours|Gesamtzahl. Stunden bis zum Enddatum|
|totalDays|Gesamtzahl. Anzahl Tage bis zum Enddatum|
|totalWeeks|Gesamtanzahl Anzahl Wochen bis zum Enddatum|
|totalMonths|Gesamtanzahl Monate bis zum Enddatum|
|totalYears|Gesamtanzahl Anzahl Jahre bis zum Enddatum|

|reached|Boolean Feld, das definiert, ob das Enddatum erreicht wurde oder nicht|
|repeatEvery|Countdown wird nach Erreichen des Enddatums um diesen Zeitraum wiederholt|

|totalsJson|JSON mit Objekten für die Summe der Stunden, Tage, Wochen, Monate und Jahre|
|fullJson|JSON mit allen Objekten|
