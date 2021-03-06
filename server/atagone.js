const dgram = require("dgram");
const http = require('http')
const macaddress = require("macaddress");
const log = require('./log');

const component = 'Atag One';
const MESSAGE_INFO_CONTROL = 1;
const MESSAGE_INFO_SCHEDULES = 2;
const MESSAGE_INFO_CONFIGURATION = 4;
const MESSAGE_INFO_REPORT = 8;
const MESSAGE_INFO_STATUS = 16;
const MESSAGE_INFO_WIFISCAN = 32;
const MESSAGE_INFO_REPORT_DETAILS = 64;

atagDevice = null;
mac = null;

connect(function(device, localMac)
{
    atagDevice = device;
    mac = localMac;
});

exports.get = function(req, res) {
    if (atagDevice == null) {
        var reply = {
            retrieve_reply: {
                report: {
                    shown_set_temp: "0",
                    room_temp: "0"
                }
            }
        };
        var responseBody = JSON.stringify(reply);
        res.send(responseBody);
    } else {
        getStatus(atagDevice, mac, function(status) {
            var responseBody = JSON.stringify(status);
            res.send(responseBody);
        });
    }
}

function connect(onSuccess)
{
    log.info(component, 'Discovering');
    var server = dgram.createSocket("udp4");
    var atagDevice = null;

    server.on("message", function (msg, rinfo) {
        var message = msg.toString();
        if (message.startsWith("ONE ")) {
            var tokens = message.split(' ');
            if (tokens.length == 3) {
                log.info(component, 'Atag One discovered');
                var device = tokens[1];
                atagDevice = {
                    id: device,
                    ipAddress: rinfo.address,
                    port: rinfo.port
                };
                server.close();
            }
        }
    });

    server.on("listening", function () {
        var address = server.address();

        log.info(component, "Listening for broadcast " + address.address + ":" + address.port);

        server.on("close", function() {
            if (atagDevice == null)  {
                log.info(component, "No Atag One found yet");
            }
            log.info(component, "   deviceId: " + atagDevice.id + " from " + atagDevice.ipAddress + ":" + atagDevice.port);

            macaddress.one(function (err, macaddress) {
                var mac = macaddress.toString();
                log.info(component, "Mac address for this host: " + mac);
                pair(atagDevice, macaddress.toString());
                onSuccess(atagDevice, macaddress);
            });
        });
    });
    server.bind(11000);
}

function pair(atagDevice, macaddress)
{
    let pair_message =
        {"pair_message":
            {
                "seqnr": 0,
                "account_auth": {
                    "user_account": "",
                    "mac_address": macaddress
                },
                "accounts": {
                    "entries": [
                        {
                            "user_account": "",
                            "mac_address": macaddress,
                            "device_name": "Specular",
                            "account_type":0
                        }
                    ]
                }
            }
        };
    const data = JSON.stringify(pair_message);

    const options = {
        hostname: atagDevice.ipAddress,
        port: 10000,
        path: '/pair_message',
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
        }
    }

    const req = http.request(options, res => {
        log.info(component, 'statusCode: ' + res.statusCode);
        res.on('data', d => {
            log.info(component, d);
        })
    });

    req.on('error', error => {
        log.info(component, error);
    });

    req.write(data);
    req.end();
}

function getStatus(atagDevice, macaddress, onSuccess)
{
    let retrieveMessage =
    {"retrieve_message":
        {
            "seqnr": 0,
            "account_auth": {
                "user_account": "",
                "mac_address": macaddress
            },
            "info": MESSAGE_INFO_STATUS + MESSAGE_INFO_REPORT
        }
    };
    const data = JSON.stringify(retrieveMessage);

    const options = {
        hostname: atagDevice.ipAddress,
        port: 10000,
        path: '/retrieve',
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
        }
    }

    const req = http.request(options, res => {
        res.setEncoding('utf8');
        let data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function() {
          onSuccess(JSON.parse(data));
        });
    })

    req.on('error', error => {
        log.info(component, 'error: ' + error);
    })

    req.write(data)
    req.end()
}