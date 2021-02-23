require("dotenv").config();
const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser;
const axios = require("axios");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn:
    "https://81d83335e38c4467ac0c955573be5d1d@o529842.ingest.sentry.io/5648774",
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "INIT",
  name: "Init Connection",
});

const port = 2525;
const server = new SMTPServer({
  secure: false,
  disabledCommands: ['STARTTLS'],
  onAuth(auth, session, callback) {
    Sentry.captureMessage("Authenticating", "info");
    if (
      auth.username !== process.env.USERNAME ||
      auth.password !== process.env.PASSWORD
    ) {
      Sentry.captureException(new Error("Invalid username or password"), {auth, session});
      return callback(new Error("Invalid username or password"));
    }
    transaction.finish();
    callback(null, { user: 1 });
  },
  onMailFrom(address, session, callback) {
    Sentry.captureMessage("Receiving Mail", "info");
    if (address.address !== process.env.USERNAME) {
      Sentry.captureException(new Error("Username not allowed"), {
        addres,
        session,
      });
      return callback(new Error("You are not allowed to send mail"));
    }
    return callback(null, { ok: true }); // Accept the address
  },
  onData(stream, session, callback) {
    parser(stream, {}, (err, parsed) => {
      if (err) {
        Sentry.captureException(new Error("Mail parsing error"), {
          error,
          session,
        });
      }
      // console.log(parsed); --> log
    //   axios.get("http://40.123.253.37:1880/debug/?Ok=true");
    // worker should do this
    // callWorker ->>
      axios
        .post(process.env.TRIGGER_URL, parsed)
        .then(function (response) {
          Sentry.captureMessage("Mail delivered to Function App", "info");
        })
        .catch(function (error) {
          Sentry.captureException(new Error("HTTP Post error"), {
            error,
            session,
          });
        });
    });
    stream.on("end", callback);
  },
  onConnect(session, callback) {
    Sentry.captureMessage("Connection estalished", "info");
    callback(null, { ok: true });
  },
});
server.on("error", (err) => {
  Sentry.captureException(new Error("App Error"), { message: err.message });
});

server.listen(port, () => {
  console.log(`Server running at on port: ${port}`);
});
