module.exports = Object.create({
        // buffer operations
                // byte => bits
                sliceBits: function(b, off, len) {
                        var s = 7 - (off + len - 1);

                        b = b >>> s;

                        return b & ~(0xff << len);
                },
                // write a number to a buffer making sure it's padded
                // and written specific to the given length
                numToBuffer: function(buffer, offset, number, length) {
                        for (var i = offset; i < offset + length; i++) {
                                var shift = 8 * ((length - 1) - (i - offset)),
                                        insert = (number >> shift) & 255;

                                buffer[i] = insert;
                        }

                        return buffer;
                },
        // queryname <=> domain translation
                qnameToDomain: function(qname) {
                        var domain = '';
                        for (var i = 0; i < qname.length; i++) {
                                if (qname[i] == 0) {
                                        //last char chop trailing .
                                        domain = domain.substring(0, domain.length - 1);
                                        break;
                                }

                                var tmpBuf = qname.slice(i + 1, i + qname[i] + 1);
                                domain += tmpBuf.toString('binary', 0, tmpBuf.length);
                                domain += '.';

                                i = i + qname[i];
                        }

                        return domain;
                },
                domainToQname: function(domain) {
                        var tokens = domain.split(".");
                        len = domain.length + 2;
                        var qname = new Buffer(len);
                        var offset = 0;
                        for (var i = 0; i < tokens.length; i++) {
                                qname[offset] = tokens[i].length;
                                offset++;
                                for (var j = 0; j < tokens[i].length; j++) {
                                        qname[offset] = tokens[i].charCodeAt(j);
                                        offset++;
                                }
                        }
                        qname[offset] = 0;

                        return qname;
                },
        // ip <=> ip dot-notation
                ip2dec: function (ip) {
                        ip = ip.split(".");

                        if ( !ip.length === 4 )
                                return 0;

                        ip = ip.map(Number);

                        if(ip.some(function (v) {
                                return isNaN(v) || (v > 255 || v < 0);
                        })) throw "Invalid IP.";

                        var _ip = 0;

                        _ip ^= ip[0] << 24;
                        _ip ^= ip[1] << 16;
                        _ip ^= ip[2] << 8;
                        _ip ^= ip[3];

                        return _ip
                },
                dec2ip: function (ip) {
                        return [
                                ip >> 24 & 0xFF,
                                ip >> 16 & 0xFF,
                                ip >> 8  & 0xFF,
                                ip       & 0xFF
                        ].join(".");
                }
});