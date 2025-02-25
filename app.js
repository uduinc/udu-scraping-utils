const scrapingUtils = {
	parseUri: function parseUri (str) {
		let	o = {
			strictMode: false,
			key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
			q:   {
				name:   "queryKey",
				parser: /(?:^|&)([^&=]*)=?([^&]*)/g
			},
			parser: {
				strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
				loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
			}
		};
		let m = o.parser[o.strictMode ? "strict" : "loose"].exec(str);
		let uri = {};
		let i = 14;

		while (i--) uri[o.key[i]] = m[i] || "";

		uri[o.q.name] = {};
		uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
			if ($1) uri[o.q.name][$1] = $2;
		});
		if (!uri.protocol && uri.user) { //handle parser not recognizing stuff like mailto: as the protocol properly
			uri.protocol = uri.user;
			uri.user = "";
		}
		if (!uri.host.includes(".")) { //handle parser not handling @s in urls appropriately (a proper url host should have a . in there somewhere)
			if (uri.user.includes(".")) { //usually there's a "user" assigned to do the @
				uri.host = uri.user;
			}
			else {
				uri.host = "";
			}
		}

		return uri;
	},
	getDomain: function getDomain (url, uriObj) {
		const secondLevelExtensions = ["com","net","co","gov","gob","gouv","gc","qc","edu","org","mil","io","biz","go","hub","business","ac","weebly","squarespace","blogspot","yolasite","wordpress","wixsite","wix","vpweb","ueniweb","webs","tripod","negocio","godaddysites","homestead","jimdo","us","edan","adv","comcastbiz","square"];

		if (!url || typeof url != "string")
			return "";

		let domain;
		if (!uriObj) {
			uriObj = scrapingUtils.parseUri(url);
		}
		domain = uriObj.host || uriObj.source || "";

		if (domain.indexOf("www.") === 0) {
			domain = domain.substr(4);
		}
		if (domain[domain.length-1] == "/") {
			domain = domain.substr(0,domain.length-1);
		}
		if (domain.match(/[,~:;!@#$%^&'(){}_#+=<>\\\/\s]/)) {
			domain = "";
		}
		if (domain) {
			let domainParts = domain.split(".");
			if (domainParts.length > 2) {
				let numParts = 2;
				if (secondLevelExtensions.indexOf(domainParts[domainParts.length-2]) != -1) {
					//Assume this is a 2 level domain or one we want the subdomain for, so we need to go 1 part further back to get the full domain
					numParts++;
				}
				domain = domainParts.slice(-numParts).join(".");
			}
		}

		return domain.toLowerCase();
	},
	findPhoneNumbers: function findPhoneNumbers ( card, country_code ) { //defaults to contact cards, supports strings
		let phone_numbers = [ ];
		let telLinkNumbers = [];

		const addPhoneNumber = function ( phone ) {
			phone = phone.replace( /\D/g, '' );
			if (phone.startsWith("00")) return;
			if (!phone_numbers.includes( phone )) {
				phone_numbers.push( phone );
			}
		};

		if (typeof card == "string") { //workaround for string submission
			card = {
				urlsFromCards: [],
				element: {
					fullText: card
				}
			};
		}

		let text = card.element.fullText;
		let phoneRegex;
		switch(country_code) { //Note: / is included in austria/germany/switzerland as it seems to be a bit of a germanic thing to separate area code with it. Not in others due to potential date false positives (length restrictions on those 3 should be fine)
			case "aus": {
				phoneRegex = new RegExp(/\b(?:(?:\+?61)|(?:0))[0-9\-\. \t()\/]{9,20}\b/g);
				break;
			}
			case "aut": {
				phoneRegex = new RegExp(/\b(?:(?:\+?43)|(?:0))[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "bel": {
				phoneRegex = new RegExp(/\b(?:(?:\+?32)|(?:0))[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "che": {
				phoneRegex = new RegExp(/\b(?:(?:\+?41)|(?:0))[0-9\-\. \t()\/]{9,20}\b/g);
				break;
			}
			case "deu": {
				phoneRegex = new RegExp(/\b(?:(?:\+?49)|(?:0))[0-9\-\. \t()\/]{9,20}\b/g);
				break;
			}
			case "dnk": {
				phoneRegex = new RegExp(/(?<!CVR(?:-nr\.?)?:?[ \t]{0,5})\b\+?[0-9\-\. \t()]{8,20}\b/gi); //Denmark has business registration numbers (CVR) that are same length as phone numbers
				break;
			}
			case "esp": {
				phoneRegex = new RegExp(/\b\+?[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "fin": {
				phoneRegex = new RegExp(/\b(?:(?:\+?358)|(?:0))[0-9\-\. \t()]{8,20}\b/g); //Note: Technically there are short numbers available but are rare. Too many false poitives
				break;
			}
			case "fra": {
				phoneRegex = new RegExp(/\b(?:(?:\+?33)|(?:0))[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "gbr": {
				phoneRegex = new RegExp(/\b(?:(?:\+?44)|(?:0))[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "ind": {
				phoneRegex = new RegExp(/\b(?:(?:\+?353)|(?:0)|(?:[6-9]))[0-9\-\. \t()]{9,15}\b/g);
				break;
			}
			case "irl": {
				phoneRegex = new RegExp(/\b(?:(?:\+?353)|(?:0))[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "ita": {
				phoneRegex = new RegExp(/(?<!(:?(:?IVA)|(:?VAT)|(:?P\.?\s?I\.?)|(:?REA)|(:?RI)|(:?COD\.?))\s?:?[ \t]{0,5})\b(?:(?:3)|(?:0)|(?:8))[0-9\-\. \t()]{5,20}\b/gi); //country code is 39, but mobile also starts with 3. landline is 0, toll free is 8. negative look behind to filter IVA/VAT tax/registration ID numbers
				break;
			}
			case "lux": {
				phoneRegex = new RegExp(/\b(\+|(00))?[2-9][0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "mex": {
				phoneRegex = new RegExp(/\b(?:\+?52)?[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "nld": {
				phoneRegex = new RegExp(/\b(?:(?:\+?31)|(?:0))[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "nor": {
				phoneRegex = new RegExp(/\b\+?[0-9\-\. \t()]{8,20}\b/g);
				break;
			}
			case "nzl": {
				phoneRegex = new RegExp(/\b(?:(?:\+?64)|(?:0))[0-9\-\. \t()]{7,20}\b/g);
				break;
			}
			case "pol": {
				phoneRegex = new RegExp(/\b\+?[0-9\-\. \t()]{9,20}\b/g);
				break;
			}
			case "swe": {
				phoneRegex = new RegExp(/\b(?:(?:\+?46)|(?:0))[0-9\-\. \t()]{7,20}\b/g);
				break;
			}
			case "can":
			case "usa":
			default: {
				phoneRegex = new RegExp(/\b1?\(?\d{3}\)?[- \t.]?\d{3}[- \t.]?\d{4}\b/g);
				break;
			}
		}

		for (let i=0; i<card.urlsFromCards.length; i++) {
			let link = card.urlsFromCards[i];
			if (link && (link.indexOf("tel:") == 0 || link.indexOf("callto:") == 0)) {
				let numberFromLink = link.replace(/%20/g,"").replace(/\D/g, '').replace(/^00/,""); //replace encoded spaces, non-numbers, AND potential starting 00 (used in place of a +)
				let passed = numberFromLink.match(phoneRegex);
				if (passed) {
					telLinkNumbers.push(passed[0]); //should not be multiple matches due to stripping out all non-digits 
					card.urlsFromCards.splice(i,1);
					i--;
				}
			}
		}

		let phoneMatches = text.match(phoneRegex);
		if (!phoneMatches) {
			phoneMatches = [];
		}
		phoneMatches = phoneMatches.concat(telLinkNumbers);
		if ( phoneMatches.length ) {
			for (let i=0; i<phoneMatches.length; i++) {
				let passed = true;
				let number = phoneMatches[i].replace(/[^0-9]/g,"").replace(/^00/,""); //replace starting 00 that is sometimes used instead of a +
				switch (country_code) {
					case "aus": {
						number = number.replace(/^610/,"61");
						if (number.length < 10 || number.length > 11) { //numbers are 10 digits, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						if (number.length > 10 && !number.startsWith("61")) { //11 digits is reserved for the addition of country code
							passed = false;
						}
						break;
					}
					case "aut": {
						number = number.replace(/^430/,"43");
						if (number.length < 9 || number.length > 16) { //number length is seemingly undefined, research says 5-15 but most 9+, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						if (number.length > 15 && !number.startsWith("43")) { //16 digits is reserved for the addition of country code
							passed = false;
						}
						break;
					}
					case "bel": {
						number = number.replace(/^320/,"32");
						if (number.length < 9 || number.length > 12) { //numbers are 9-10 digits, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						if (number.length > 9 && !number.startsWith("32") && !number.startsWith("04")) { //10+ digits is reserved for a specific area code (mobiles) or the addition of country code
							passed = false;
						}
						break;
					}
					case "che": {
						number = number.replace(/^410/,"41");
						if ((number[0] == "0" && number.length != 10) || (number[0] == "4" && number.length != 11)) { //all numbers are 9 digits + trunk code (1 digit) or country code (2 digits)
							passed = false;
						}
						break;
					}
					case "deu": {
						number = number.replace(/^490/,"49");
						if (number.length < 9 || number.length > 15) { //numbers are 9-13 digits, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						break;
					}
					case "dnk": {
						if (number.length != 8 && !(number.length == 10 && number.startsWith("45"))) { //numbers are 8 digits OR 10 with inclusion of country code
							passed = false;
						}
						else { //lot of problems with false positives due to no real format beyond "8 digits", so try to enforce expected structure:
							let rawText = phoneMatches[i].replace(/^00/,"");
							if (!rawText.match(/\d{8}/) &&  //nnnnnnnn
								!rawText.match(/\d{2}[0-9\-\. \t()]\d{2}[0-9\-\. \t()]\d{2}[0-9\-\. \t()]\d{2}/) && //nn nn nn nn
								!rawText.match(/\d{2}[0-9\-\. \t()]\d{3}[0-9\-\. \t()]\d{3}/) && //nn nnn nnn
								!rawText.match(/\d{4}[0-9\-\. \t()]\d{4}/)) //nnnn nnnn
							{
								passed = false;
							}
						}
						break;
					}
					case "esp": {
						if (number.length != 9 && !(number.length == 11 && number.startsWith("34"))) { //numbers are 9 digits OR 11 with inclusion of country code
							passed = false;
						}
						break;
					}
					case "fin": { //Note: Technically there are short numbers available but are rare. May need to just ignore these if too many false positives
						number = number.replace(/^3580/,"358");
						if ((number[0] == "0" && (number.length < 9 || number.length > 12)) || (number.startsWith("358") && (number.length < 11 || number.length > 14))) { //non trunk/area code are 5-12 digits, country code 3 digits, area code 1+. most numbers are 7 digits so sticking with that for false positives
							passed = false;
						}
						break;					
					}
					case "fra": {
						number = number.replace(/^330/,"33");
						if (number.length != 10 && !((number.length == 11 || number.length == 12) && number.startsWith("330"))) { //numbers are 10 digits, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						break;					
					}
					case "gbr": {
						number = number.replace(/^440/,"44");
						if (number.length < 10 || number.length > 13) { //numbers are 10-11 digits, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						break;
					}
					case "ind": { //numbers are 10 digits, 2 digits for potential country code OR 1 digit for leading 0 (not used on mobile). local calls would be shorter (like usa) but we shouldnt encounter these. mobile starts 6-9
						number = number.replace(/^910/,"91");
						if (number.startsWith("91")) { //international
							if (number.length != 12 && number.length != 10) { //12 for internation, 10 for potential mobile
								passed = false;
							}
						} 
						else if (number.startsWith("0")) { //long distance landline
							if (number.length != 11) {
								passed = false;
							}
						}
						else if (["6","7","8","9"].includes(number[0])) { //mobile
							if (number.length != 10) { 
								passed = false;
							}
						}
						else { //invalid starting digit (1-5)
							passed = false;
						}
						break;
					}
					case "irl": {
						number = number.replace(/^3530/,"353");
						if (number.length < 6 || number.length > 12) { //numbers are 8-10 digits, 3 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						if (number.length > 10 && number.startsWith("0")) { //curb some UK numbers making it through
							passed = false;
						}
						break;
					}
					case "ita": { //weird if branching to ensure logic not getting tripped up with final mobile length check due to sharing prefix with country code
						if (number.startsWith("0")) {
							if (number.length < 8 || number.length > 11) { //landline numbers are 6-11 digits, prefix is kept. only accepting 8+ due to false positives and how infrequent they are for what we care about
								passed = false;
							}
						}
						else if (number.startsWith("8")) {
							if (number.length != 9) { //must be 9 digits (3 prefix + 6 number) apparently?
								passed = false;
							}
						}
						else if (number.startsWith("3")) { 
							if (number.startsWith("390") || number.startsWith("398")) {
								if (number.length < 8 || number.length > 13) { //landline numbers are 6-11 digits + 2 for country code, prefix is kept
									passed = false;
								}
							}
							else if (number.startsWith("393")) {
								if (number.length < 11 || number.length > 12) { //mobile numbers are 9-10 digits (mostly 10) + 2 for country code, prefix is kept
									passed = false;
								}
							}
							else if (number.length < 9 || number.length > 10) { //mobile numbers are 9-10 digits (mostly 10), prefix is kept
								passed = false;
							}
						}
						else { //must start with 0, 8, or 3 (country code is 39 so included in mobile prefix 3)
							passed = false;
						}
						break;
					}
					case "mex": {
						number = number.replace(/^3530/,"353");
						if (!((number.length == 10 && number[0].match(/[2-9]/)) || (number.length == 12 && number.startsWith("52") && number[2].match(/[2-9]/)))) { //numbers are 10 digits and do not start with 0 or 1. 12 digits only if country code is prefixed
							passed = false;
						}
						break;
					}
					case "lux": {
						if (number.length < 8 || number.length > 12) { //numbers are 8-10 digits, 3 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						let testingNumber = number.replace(/^352/,"");
						if (testingNumber[0] == "6" && testingNumber.length != 9) { //mobile numbers are always 9 digit and start with a 6
							passed = false;
						}
						if (testingNumber[0] != "6" && testingNumber.length != 6 && testingNumber.length != 8) { //older numbers are 6 digits, newer should be 8 (unless mobile)
							passed = false;
						}
						if (testingNumber.length == 8 && testingNumber[0] != "2") { //newer 8 digit numbers should start with a 2
							passed = false;
						}
						break;
					}
					case "nld": {
						number = number.replace(/^310/,"31");
						if (number.length != 10 && !((number.length == 11 || number.length == 12) && number.startsWith("310"))) { //numbers are 10 digits, 2 digits for potential country code. leading 0 that should be wiped on country code may be present
							passed = false;
						}
						break;					
					}
					case "nor": {
						if (number.length != 8 && !(number.length == 10 && number.startsWith("47"))) { //numbers are 8 digits OR 10 with inclusion of country code (has 12 digit M2M but we dont care about those i think)
							passed = false;
						}
						else { //lot of problems with false positives due to no real format beyond "8 digits", so try to enforce expected structure:
							let rawText = phoneMatches[i].replace(/^00/,"");
							if (!rawText.match(/\d{8}/) &&  //nnnnnnnn
								!rawText.match(/\d{2}[0-9\-\. \t()]\d{2}[0-9\-\. \t()]\d{2}[0-9\-\. \t()]\d{2}/) && //nn nn nn nn
								!rawText.match(/\d{2}[0-9\-\. \t()]\d{3}[0-9\-\. \t()]\d{3}/) && //nn nnn nnn
								!rawText.match(/\d{4}[0-9\-\. \t()]\d{4}/)) //nnnn nnnn
							{
								passed = false;
							}
						}
						break;
					}
					case "nzl": {
						number = number.replace(/^640/,"64");
						const landLineCodes = ["3","4","6","7","9"]; //5 and 8 are toll free, 2 is mobile, 1 is generally government services that we dont want
						const mobileCodes = ["2","5","8"]; //toll free codes treated as mobile for sake of lengths
						let areaCode = number[1];
						let hasCountryCode = false;
						if (number[0] != "0") {
							areaCode = number[2];
							hasCountryCode = true;
						}
						if (!landLineCodes.includes(areaCode) && !mobileCodes.includes(areaCode)) { //all "area codes" are 1 digit limited to above, 2 is mobile with varying lengths thus the distinction
							passed = false;
						}
						else if (landLineCodes.includes(areaCode) && ((hasCountryCode && number.length != 10) || (!hasCountryCode && number.length != 9))) { //landlines are 7 digits + 1 area code + 1 or 2 depending on leading 0 or country code
							passed = false;
						}
						else if (mobileCodes.includes(areaCode) && ((hasCountryCode && (number.length < 10 || number.length > 12)) || (!hasCountryCode && (number.length < 9 || number.length > 11)))) { //mobiles are 7-9 digits + 1 mobile code + 1 or 2 depending on leading 0 or country code
							passed = false;
						}
						break;					
					}
					case "pol": {
						if (number.length != 9 && !(number.length == 11 && number.startsWith("48"))) { //numbers are 9 digits OR 11 with inclusion of country code
							passed = false;
						}
						break;
					}
					case "swe": {
						number = number.replace(/^460/,"46");
						if (number.length < 8 || number.length > 15) { //numbers are 7-13 digits, 1-2 digits for potential leading 0 or country code.
							passed = false;
						}
						break;
					}
					case "can": //usa and can format is strict, but we want to filter out country code (leading 1) and fictional numbers (555 area code)
					case "usa":
					default: {
						if (number.length == 11) {
							number = number.replace(/^1/,"");
						}
						if (number.startsWith("555")) {
							passed = false;
						}
						break;
					}
				}
				if (passed) {
					addPhoneNumber( number );
				}
			}
		}
		return phone_numbers;
	}
};

exports = module.exports = scrapingUtils;