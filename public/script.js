// REPLACE <...> BY YOUR FIREBASE PROJECT CONFIGURATION:
const config = {
	apiKey: "AIzaSyBtCTVheElrr-cK4GJgmCPvjgB6SCIPmDg",
	authDomain: "vacina-palmas.firebaseapp.com",
	databaseURL: "https://vacina-palmas.firebaseio.com",
	projectId: "vacina-palmas",
	storageBucket: "vacina-palmas.appspot.com",
	messagingSenderId: "399630435316",
	appId: "1:399630435316:web:f8f15557621bfdd8516fa1",
	measurementId: "G-88Q863T99H"
};
moment.locale("pt-BR");
firebase.initializeApp(config);

// Number of last elements to work with, in the 'timestamped_measures' node of the database:
const nbOfElts = 300;

// The big picture: EACH TIME A VALUE CHANGES in the 'timestamped_measures' node, e.g.
// when a new timestamped measure has been pushed to that node,
// we make an array of the last 'nbOfElts' timestamps
// and another array of the last 'nbOfElts' luminosity values.
// This is because plotly.js, our plotting library, requires arrays of data, one for x and one for y.
// Those sliding arrays produce a live data effect.
// -----
// See https://firebase.google.com/docs/database/web/lists-of-data for trigger syntax:
var database = firebase.database();

let devices = database.ref("devices");

devices.on("value", devices => {
	devices.forEach(device => {
		database
			.ref("measures/" + device.key)
			.limitToLast(nbOfElts)
			.on("value", measures => {
				// If you want to get into details, read the following comments :-)
				// 'ts_measures' is a snapshot raw Object, obtained on changed value of 'timestamped_measures' node
				// e.g. a new push to that node, but is not exploitable yet.
				// If we apply the val() method to it, we get something to start work with,
				// i.e. an Object with the 'nbOfElts' last nodes in 'timestamped_measures' node.
				// console.log(ts_measures.val());
				// => {-LIQgqG3c4MjNhJzlgsZ: {timestamp: 1532694324305, value: 714}, -LIQgrs_ejvxcF0MqFre: {…}, … }

				// We prepare empty arrays to welcome timestamps and luminosity values:
				let timestamps = [];
				let values = [];

				// Next, we iterate on each element of the 'ts_measures' raw Object
				// in order to fill the arrays.
				// Let's call 'ts_measure' ONE element of the ts_measures raw Object
				// A handler function written here as an anonymous function with fat arrow syntax
				// tells what to do with each element:
				// * apply the val() method to it to gain access to values of 'timestamp' and 'value',
				// * push those latter to the appropriate arrays.
				// Note: The luminosity value is directly pushed to 'values' array but the timestamp,
				// which is an Epoch time in milliseconds, is converted to human date
				// thanks to the moment().format() function coming from the moment.js library.
				measures.forEach(measure => {
					//console.log(ts_measure.val().timestamp, ts_measure.val().value);
					timestamps.push(
						moment(measure.val().timestamp).format("YYYY-MM-DD HH:mm:ss")
					);
					values.push(measure.val().temperature);

					document.getElementById(
						"temperature"
					).innerHTML = measure.val().temperature;
					document.getElementById(
						"humidity"
					).innerHTML = measure.val().humidity;
				});

				// Get a reference to the DOM node that welcomes the plot drawn by Plotly.js:
				myPlotDiv = document.getElementById("myPlot");

				// We generate x and y data necessited by Plotly.js to draw the plot
				// and its layout information as well:
				// See https://plot.ly/javascript/getting-started/
				const data = [
					{
						x: timestamps,
						y: values,
						type: "scatter"
					}
				];

				const layout = {
					title:
						"<b>Temperatura em tempo real da " +
						device.val().name +
						"</b>",
					titlefont: {
						family: "Courier New, monospace",
						size: 16,
						color: "#000"
					},
					xaxis: {
						linecolor: "black",
						linewidth: 2
					},
					yaxis: {
						title: "<b>Temperatura em °C</b>",
						titlefont: {
							family: "Courier New, monospace",
							size: 14,
							color: "#000"
						},
						linecolor: "black",
						linewidth: 2
					},
					margin: {
						r: 50,
						pad: 0
					}
				};
				// At last we plot data :-)
				Plotly.newPlot(myPlotDiv, data, layout, { responsive: true });
			});
	});
});
