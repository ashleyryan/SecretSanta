'use strict';
const fs = require('fs');
const parse = require('csv-parse');
const commandLineArgs = require('command-line-args');
const jsonfile = require('jsonfile')
const nodemailer = require('nodemailer');

const _ = require('underscore');

// define the options
const options = commandLineArgs([
	{ name: 'src', type: String, multiple: false, defaultOption: true },
	{ name: 'email', alias: 'e', type: Boolean },
	{ name: 'debug', alias: 'd', type: Boolean },
	{ name: 'smtp', type: String} //https://nodemailer.com/2-0-0-beta/setup-smtp/
]);

if(!options.src) {
	console.log("please specify a source csv");
	process.exit();
}

// parse the csv and kick off the matching
var parser = parse({columns: ['Name', 'Email', 'SO']}, (err, data) => {
	if(err) {
		console.log(err);
		return;
	}

	if(options.debug) {
		console.log(data);
	}

	var matches = makeMatches(_.shuffle(data));

	if(options.debug) {
		matches.forEach(p => {
			console.log(`${p.Name} matched with ${p.Match.Name}`);
		});
	}

	if(options.email) {
		jsonfile.readFile(options.smtp, function(err, obj) {
			if(err) {
				console.log(err);
				return;
			}
			sendEmails(matches, obj);
		});
	}
});

// given an array of people, iterate over it and find a match for each person,
// excluding significant others
var makeMatches = (people) => {
	// clear any existing match data
	people.forEach((p) => {
		p.Matched = false;
		p.Match = undefined;
	});

	const incrementCounter = (index, max) => {
		return  (index === max) ? 0 : index+1;
	};

	for(var i = 0; i < people.length; i++) {
		let gifter = people[i],
		matchFound = false,
		index = incrementCounter(i, people.length - 1);

		while(!matchFound) {
			let currPerson = people[index];
			// gifters cannot be matched with their SO
			if(gifter.SO !== currPerson.Name && !currPerson.Matched) {
				gifter.Match = currPerson;
				currPerson.Matched = true;
				matchFound = true;
			}
			index = incrementCounter(index, people.length - 1);
		}
	}

	return people;
};

var sendEmails = (people, smtp) => {
	if(!smtp) {
		console.log("ERR: No smtp settings specified");
		return;
	}

	var transporter = nodemailer.createTransport(smtp);

	var mailOptions = {
		from: '"Secret Santa" ' + smtp.auth.user,
		to: '',
		subject: 'Prudden Family Secret Santa Match!'
	};

	people.forEach(p => {
		if(options.debug) {
			console.log(`Emailing ${p.Name}`)
		}

		mailOptions.to = p.Email;
		mailOptions.html = `<b>${p.Name}, you've been matched!</b><br/><br/>
			Your secret santa giftee is: ${p.Match.Name}.<br/><br/>
			Note: This email was automated. Ashley doesn't know who you have.`;

		transporter.sendMail(mailOptions, function(error, info){
			if(error){
				console.log(error);
				return;
			}
			if(options.debug) {
				console.log('Message sent: ' + info.response);
			}
		});
	});
};

// read in the file and begin
fs.createReadStream(options.src).pipe(parser);
