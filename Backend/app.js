import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import fileRoutes from "./src/routes/file.route.js";
import directoryRoutes from "./src/routes/directory.route.js";
import userRoutes from "./src/routes/user.route.js";
import authRoutes from "./src/routes/auth.route.js";
import fileShareRoutes from "./src/routes/fileShare.route.js";
import itemRoutes from "./src/routes/item.route.js";
import subscriptionRoutes from "./src/routes/subscription.route.js";
import planRoutes from "./src/routes/plan.route.js";
import appSettingRoutes from "./src/routes/appSetting.route.js";
import deployRoutes from "./src/routes/deploy.route.js";
import checkAuthentication from "./src/middlewares/authenticate.middleware.js";
import { globalErrorHandler } from "./src/middlewares/errorHandler.middleware.js";
import { globalLimiter } from "./src/middlewares/rateLimiter.middleware.js";

import "./src/services/taskScheduler.service.js";
import preventCsrf from "./src/middlewares/preventCsrf.middleware.js";
import attachAppSettings from "./src/middlewares/attachAppSettings.middleware.js";

const app = express();

// Trust the first proxy (necessary for accurate IP detection behind Nginx/Cloudflare)
// 1 means we know we are exactly behind 1 proxy
app.set("trust proxy", 1);

// Apply global rate limiting to all routes
app.use(globalLimiter);

// add database access
try {
  await connectDB();
} catch (error) {
  console.log(error);
  process.exit(1);
}

app.use(
  cors({
    origin: [process.env.FRONTEND_URI],
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  }),
);

app.use(preventCsrf); //preventing CSRF, helpful when cors by-passed
app.use(cookieParser(process.env.COOKIE_PARSER_KEY));

/** Webhooks */
// body should be passed as raw to webhook
app.use("/deploy", deployRoutes);
app.use("/subscriptions", subscriptionRoutes);

// attach the whole app settings to each route
app.use(attachAppSettings);

app.use(express.json());
app.use("/directory", checkAuthentication, directoryRoutes);
app.use("/file", checkAuthentication, fileRoutes);
app.use("/share", checkAuthentication, fileShareRoutes);
app.use("/user", checkAuthentication, userRoutes);
app.use("/item", checkAuthentication, itemRoutes);
app.use("/app-setting", checkAuthentication, appSettingRoutes);
app.use("/plans", planRoutes);
app.use("/auth", authRoutes);

// global error handler — consistent { error, errorCode } response
app.use(globalErrorHandler);

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () =>
  console.log(`server is running at port ${port}`),
);
