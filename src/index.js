require("dotenv").config();
const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser;
const axios = require("axios");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn:
    "https://edd9e0cf639e40fcb941fadb13fba408@o529842.ingest.sentry.io/5648761",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

const port = 2525;
const server = new SMTPServer({
  secure: false,
  disabledCommands: ['STARTTLS'],
  onAuth(auth, session, callback) {
    if (
      auth.username !== process.env.USERNAME ||
      auth.password !== process.env.PASSWORD
    ) {
      Sentry.captureException("Invalid username or password:", {auth, session});
      return callback(new Error("Invalid username or password"));
    }
    callback(null, { user: 1 });
  },
  onMailFrom(address, session, callback) {
    if (address.address !== process.env.USERNAME) {
      Sentry.captureException("Username not allowed:", {
        addres,
        session,
      });
      return callback(new Error("You are not allowed to send mail"));
    }
    return callback(null, { ok: true }); // Accept the address
  },
  onData(stream, session, callback) {
    // stream.pipe(process.stdout); // print message to console
    // stream.on("end", callback);
    parser(stream, {}, (err, parsed) => {
      if (err) {
        Sentry.captureException("Mail Parse error:", {
          err,
          session
        });
      }
      // console.log(parsed); --> log
    //   axios.get("http://40.123.253.37:1880/debug/?Ok=true");
    // worker should do this
    // callWorker ->>
      axios
        .post(process.env.TRIGGER_URL, parsed)
        .then(function (response) {
          console.log("OK");
        })
        .catch(function (error) {
          console.log("Error");
          Sentry.captureException("HTTP Post error:", {
            error,
            session,
          });
        });
    });
    stream.on("end", callback);
  },
  onConnect(session, callback) {
    callback(null, { ok: true });
  },
});
server.on("error", (err) => {
  Sentry.captureException("Error:", {message: err.message});
  console.log("Error %s", err.message);
});

server.listen(port, () => {
  console.log(`Server running at on port: ${port}`);
});
