require("dotenv").config();
const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser;
const axios = require("axios");

const port = 2525;
const server = new SMTPServer({
  secure: false,
  disabledCommands: ['STARTTLS'],
  onAuth(auth, session, callback) {
    if (
      auth.username !== process.env.USERNAME ||
      auth.password !== process.env.PASSWORD
    ) {
      return callback(new Error("Invalid username or password"));
    }
    callback(null, { user: 1 });
  },
  onMailFrom(address, session, callback) {
    if (address.address !== process.env.USERNAME) {
      return callback(new Error("You are not allowed to send mail"));
    }
    return callback(null, { ok: true }); // Accept the address
  },
  onData(stream, session, callback) {
    // stream.pipe(process.stdout); // print message to console
    // stream.on("end", callback);
    parser(stream, {}, (err, parsed) => {
      if (err) {
        console.log("Error:", err);
      }
      axios.get("http://40.123.253.37:1880/?Ok=true");
      axios
        .post(process.env.TRIGGER_URL, parsed)
        .then(function (response) {
          console.log("OK");
        })
        .catch(function (error) {
          console.log("Error");
        });
    });
    stream.on("end", callback);
  },
  onConnect(session, callback) {
    callback(null, { ok: true });
  },
});
server.on("error", (err) => {
  console.log("Error %s", err.message);
});

server.listen(port, () => {
  console.log(`Server running at on port: ${port}`);
});
