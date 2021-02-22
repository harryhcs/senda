const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser;
const axios = require("axios");

const port = 2525;

const server = new SMTPServer({
  secure: false,
  disabledCommands: ['STARTTLS'],
  onAuth(auth, session, callback) {
    if (
      auth.username !== "postmaster@snapcatch.org" ||
      auth.password !== "123"
    ) {
      return callback(new Error("Invalid username or password"));
    }
    callback(null, { user: 1 });
  },
  onMailFrom(address, session, callback) {
    console.log(session);
    if (address.address !== "postmaster@snapcatch.org") {
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
      axios
        .post("https://7a25e699420a.ngrok.io/api/ProcessEmail/", parsed)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
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
