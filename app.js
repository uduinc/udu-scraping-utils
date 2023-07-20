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
		const secondLevelExtensions = ["com","net","co","gov","edu","org","mil","io","biz","go","hub","business","weebly","squarespace","blogspot","yolasite","wordpress","wixsite","wix","vpweb","ueniweb","webs","tripod","negocio","godaddysites","homestead","jimdo","us","edan"];

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
	}
};

exports = module.exports = scrapingUtils;