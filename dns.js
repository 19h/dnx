//     ___ ____ __ __
//    / _ `/ _ \\ \ /
//    \_,_/ .__/_\_\ 
//       /_/ 
//    
//    過去は未来によって変えられる。

//
// Copyright (c) 2014 Kenan Sulayman aka apx
//

// Based on third-party code:
//
// Copyright (c) 2010 Tom Hughes-Croucher
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var dgram = require("dgram"),
     util = require("util");

var host = "localhost",
    port = process.env.port || 53;

const rev = 13;

var server = dgram.createSocket("udp4");

var dnx = Object.create({
	records: {},
	addRecord: function (domain) {
		this.records[domain] = {
			in: {
				a: []//,
				// not implemented
			}
		};

		var qname = this.toolchain.utils.domainToQname(domain);

		return {
			delegate: function (r) {
				if ( typeof r.rdata === "string" ) {
					r.rdata = this.toolchain.utils.ip2dec(r.rdata);
				}

				if ( !r["qname"] ) {
					r["qname"] = qname;
				}

				r["zname"] = domain;

				if ( !this.records[domain] )
					this.records[domain] = {};

				if ( !this.records[domain]["in"] )
					this.records[domain]["in"] = {};

				if ( !this.records[domain]["in"][r.type || "a"] )
					this.records[domain]["in"][r.type || "a"] = [];

				return this.records[domain]["in"][r.type || "a"].push(r), r;
			}.bind(this)
		};
	},
	server: server,
	toolchain: require("./lib/toolchain")
});

server.on("message", function(msg, rinfo) {
	// parse query
	var q = dnx.toolchain.processRequest(msg);

	// build response
	var buf = dnx.toolchain.createResponse(q, dnx.records);

	dnx.server.send(buf, 0, buf.length, rinfo.port, rinfo.address);
});

server.addListener("error", function(e) {
	throw e;
});

// TODO - create a more maintainable database

var record = dnx.addRecord("sly.mn");

record.delegate({
	qtype: 1,
	qclass: 1,
	ttl: 299,
	rdlength: 4,
	rdata: "212.227.103.211"
});

server.bind(port, host);

console.log([
	"     __        ",
	" ___/ /__ __ __",
	"/ _  / _ \\\\ \\ /",
	"\\_,_/_//_/_\\_\\",
	"               \t",
	"[dnx r" + rev + "]",
	""
].join("\n"))

require("dns").resolve(host, function (err, data) {
	var revlookup = data ? " (" + data.join(", ") + ")" : "";

	console.log("Delegation:");

	Object.keys(dnx.records).forEach(function (d) {
		console.log("\t=> ", d);

		Object.keys(dnx.records[d]).forEach(function (c) {
			Object.keys(dnx.records[d][c]).forEach(function (r) {
				console.log("\t\t" + c + ": " + r + ":");
				
				dnx.records[d][c][r].forEach(function (rx) {
					console.log("\t\t\t", rx.qname, " (" + rx["zname"] + "): ", util.inspect(rx, {depth: null}).split("{ ").join("{\n  ").split("\n").join("\n\t\t\t\t").split(" }").join("\n\t\t\t }"))
				})
			})
		});
	})

	process.stdout.write("\nStarted server: " + host + revlookup + ", using port " + port + ".");
});