require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");
const createAdmin = require("./utils/createAdmin");

const PORT = process.env.PORT || 5000;
const startMaturityScheduler =
  require("./jobs/maturityScheduler");
const { processMaturedSubscriptions } = require("./services/maturityService");

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

connectDatabase()
  .then(async () => {
    console.log("MongoDB connected");

    await createAdmin();

    /*
     * Catch-up: process any subscriptions that matured while the
     * server was asleep/stopped, so no returns are missed.
     */
    try {
      console.log(
        "[Maturity Catch-Up] Started",
      );

      const catchUpResult =
        await processMaturedSubscriptions();

      console.log(
        "[Maturity Catch-Up] Completed:",
        catchUpResult,
      );
    } catch (catchUpError) {
      console.error(
        "[Maturity Catch-Up] Error:",
        catchUpError.message,
      );
    }

    startMaturityScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `Server Running On Port ${PORT}`,
      );
    });
  })
  .catch((err) => {
    console.error(
      "Database Connection Failed:",
      err,
    );

    process.exit(1);
  });