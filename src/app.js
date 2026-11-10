import { resolve } from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import express from "express";
import { engine } from "express-handlebars";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { flashMessages } from "./middlewares/flash-messages.js";
import { exposeCurrentUser } from "./middlewares/auth-guard.js";
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
    helpers: {
      eq: (left, right) => String(left) === String(right),
      selected: (left, right) => String(left) === String(right) ? "selected" : "",
      formatDate(value) {
        if (!value) return "";
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[3]}/${match[2]}/${match[1]}`;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime())
          ? ""
          : `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
      },
      formatKz(value) {
        if (value === null || value === undefined || value === "") return "";
        const match = String(value).match(/^(-?)(\d+)(?:\.(\d+))?$/);
        if (!match) return `${value} Kz`;
        const integer = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `${match[1]}${integer}${match[3] === undefined ? "" : `.${match[3]}`} Kz`;
      },
    },
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
app.use(exposeCurrentUser);
app.use((req, res, next) => {
  req.session.csrfToken ??= randomBytes(32).toString("hex");
  res.locals.csrfToken = req.session.csrfToken;

  if (!["POST", "PUT", "DELETE"].includes(req.method)) return next();

  const submitted = req.body?._csrf;
  const expected = req.session.csrfToken;
  const valid = typeof submitted === "string"
    && submitted.length === expected.length
    && timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));
  if (!valid) {
    return res.status(403).render("pages/403", {
      title: "Forbidden",
      message: "The form token is missing or expired. Please go back and try again.",
    });
  }
  return next();
});
app.use(routes);
app.use(notFoundHandler);
app.use(errorHandler);
