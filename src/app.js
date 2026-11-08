import { resolve } from "node:path";
import express from "express";
import { engine } from "express-handlebars";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { flashMessages } from "./middlewares/flash-messages.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import routes from "./routes/index.js";

const MySQLStore = MySQLStoreFactory(session);
const viewsDirectory = resolve(process.cwd(), "views");

export const app = express();

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    layoutsDir: resolve(viewsDirectory, "layouts"),
    partialsDir: resolve(viewsDirectory, "partials"),
    defaultLayout: "main",
  }),
);
app.set("view engine", "hbs");
app.set("views", viewsDirectory);
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

app.use(helmet());
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.static(resolve(process.cwd(), "public")));
app.use(
  "/vendor/bootstrap",
  express.static(resolve(process.cwd(), "node_modules/bootstrap/dist")),
);

export const sessionStore = new MySQLStore({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  createDatabaseTable: true,
  schema: {
    tableName: "sessions",
  },
});

app.use(
  session({
    store: sessionStore,
    name: "microcredit.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);
app.use(flashMessages);
app.use(routes);
app.use(notFoundHandler);
app.use(errorHandler);
