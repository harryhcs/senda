const fs = require("fs");
const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser;
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
      //   Do something with parsed. Send somewhere?
      console.log(parsed);
    });
    stream.on("end", callback);
    // return callback(null, { ok: true });
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
