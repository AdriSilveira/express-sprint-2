import express, { query } from "express";
import cors from "cors";
import database from "./database.js";
import modulesRouter from "./routers/modules-router.js";
import usersRouter from "./routers/users-router.js";
import groupsRouter from "./routers/modules-router.js";
import usermoduleRouter from "./routers/usermodules-router.js";
import yearsRouter from "./routers/usermodules-router.js";

//====================CHANGES HERE UPDATED THE PUT/UPDATE STATUS ==================
// Configure express app -------------------------
const app = new express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Configure middleware --------------------------
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

// ----------------------------Endpoints -------------------------------------

//MODULES
app.use("/api/modules", modulesRouter);
//USERS
app.use("/api/users", usersRouter);
//GROUPS
app.use("/api/groups", groupsRouter);

//YEARS
app.use("/api/years", yearsRouter);

//USERMODULE
app.use("/api/usermodule", usermoduleRouter);
//Contribution
//Assessments

// Start server ----------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
