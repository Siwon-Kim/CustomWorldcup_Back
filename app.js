const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const errorHandler = require("./middlewares/error-handler");
const { host, sentry } = require("./config/config");
const port = host.port;
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output");
const cors = require("cors");
const Sentry = require("@sentry/node");

// sentry
Sentry.init({
  dsn: sentry.dsn,
  tracesSampleRate: 1.0,
});
app.use(Sentry.Handlers.requestHandler());

// parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// logger
app.use(morgan("dev"));

// cors
app.use(
  cors({
    origin: "*",
    credentials: "true",
    // cors options
  })
);

// swagger
app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// router
const apiMainRouter = require("./routes/index");
app.use("/api", [apiMainRouter]);

// errorHandler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`running http://localhost:${port}`);
});

module.exports = app;
