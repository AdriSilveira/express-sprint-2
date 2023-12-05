// Imports ---------------------------------------
import express from "express";
import cors from "cors";
import database from "./database.js";

// Configure express app -------------------------
const app = new express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure middleware --------------------------
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

// Controllers -----------------------------------
const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );

const buildModulemembersInsertSql = (record) => {
  let table = "UserModule";
  let mutableFields = ["userModuleID", "userID", "moduleID"];
  return `INSERT INTO ${table} ` + buildSetFields(mutableFields);
};

const buildModulesInsertSql = (record) => {
  let table = "Modules";
  let mutableFields = [
    "moduleID",
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    "moduleImageURL",
  ];
  console.log("where is not working?");
  return `INSERT INTO ${table} ` + buildSetFields(mutableFields);
};
console.log("Here");
//=========here to fix?============
const buildModulemembersSelectSql = (id, variant) => {
  let table =
    "((UserModule LEFT JOIN Users ON userID) LEFT JOIN Modules ON UserModule=moduleID )";
  let fields = [
    //"module",
    "moduleID",
    'CONCAT(moduleCode," ",moduleName) AS moduleName',
    "userID",
    'CONCAT(userFirstName," ",userLastName) AS userName',
  ];
  let sql = "";
  console.log("Here PPPPP");
  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE userModuleID=${id}`;
      console.log("Here AAAAAA");
  }
  return sql;
};
console.log("Here BBBBB");
const buildModulesSelectSql = (id, variant) => {
  let table =
    "((Modules LEFT JOIN Users ON moduleLeaderID=userID) LEFT JOIN Years ON moduleYearID=yearID )";
  let fields = [
    "moduleID",
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    "moduleImageURL",
    'CONCAT(userFirstName," ",userLastName) AS moduleLeaderName',
    "yearName AS moduleYearName",
  ];
  let sql = "";

  switch (variant) {
    case "leader":
      sql = `SELECT ${fields} FROM ${table} WHERE moduleLeaderID=${id}`;
      break;
    case "users":
      table = `UserModule INNER JOIN ${table} ON UserModule.userModuleID=Modules.moduleID`;
      sql = `SELECT ${fields} FROM ${table} WHERE userModuleID=${id}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE moduleID=${id}`;
  }

  return sql;
};

const buildUsersSelectSql = (id, variant) => {
  let table =
    "((Users LEFT JOIN UserType ON userTypeID=userTypeID) LEFT JOIN Years ON userYearID=yearID )";
  let fields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    // "UserYearName",
    "userImageURL",
    // "UsertypeName AS UserUsertypeName",
    // "YearName AS UserYearName",
  ];
  let sql = "";

  const STAFF = 1; // Primary key for staff type in Unibase Usertypes table
  const STUDENT = 2; // Primary key for student type in Unibase Usertypes table

  switch (variant) {
    case "student":
      sql = `SELECT ${fields} FROM ${table} WHERE usertypeID=${STUDENT}`;
      break;
    case "staff":
      sql = `SELECT ${fields} FROM ${table} WHERE usertypeID=${STAFF}`;
      break;
    case "groups":
      table = `GroupMembers INNER JOIN ${table} ON GroupMembers.groupMemberID=Users.UserID`;
      sql = `SELECT ${fields} FROM ${table} WHERE groupID=${id}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE userID=${id}`;
  }

  return sql;
};

const buildYearsSelectSql = (id, variant) => {
  let table = "Years";
  let fields = ["yearID", "yearName"];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE moduleID=${id}`;
  }

  return sql;
};
//Build Groups ----------HERE-------------HERE-----------------
const buildGroupsSelecetSql = (id, variant) => {
  let table = "Groups";
  let fields = ["groupID", "groupName", "groupModuleName"];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE GroupID=${id}`;
  }
  return sql;
};
const getGroupsController = async (res, id, variant) => {
  //Validate reques

  // Access data
  const sql = buildGroupsSelectSql(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

const createModulemembers = async (sql, record) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildModulemembersSelectSql(
      status[0].insertId,
      null
    );

    const { isSuccess, result, message } = await read(recoverRecordSql);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover the inserted record: ${message}`,
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const createModules = async (sql, record) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildModulesSelectSql(status[0].insertId, null);

    const { isSuccess, result, message } = await read(recoverRecordSql);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover the inserted record: ${message}`,
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const read = async (sql) => {
  try {
    const [result] = await database.query(sql);
    return result.length === 0
      ? { isSuccess: false, result: null, message: "No record(s) found" }
      : {
          isSuccess: true,
          result: result,
          message: "Record(s) successfully recovered",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const postModulemembersController = async (req, res) => {
  // Validate request

  // Access data
  const sql = buildModulemembersInsertSql(req.body);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createModulemembers(sql, req.body);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

const getModulemembersController = async (res, id, variant) => {
  // Validate request

  // Access data
  const sql = buildModulemembersSelectSql(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

const getModulesController = async (res, id, variant) => {
  // Validate request

  // Access data
  const sql = buildModulesSelectSql(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
//POST MODULE CONTROLLER-----------------------------------------
const postModulesController = async (req, res) => {
  // Validate request

  // Access data
  const sql = buildModulesInsertSql(req.body);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createModules(sql, req.body);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

const getUsersController = async (res, id, variant) => {
  // Validate request

  // Access data
  const sql = buildUsersSelectSql(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

const getYearsController = async (res, id, variant) => {
  // Validate request

  // Access data
  const sql = buildYearsSelectSql(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

// Endpoints -------------------------------------
// Modulemembers
app.get("/api/modulemembers", (req, res) =>
  getModulemembersController(res, null, null)
);
app.get("/api/modulemembers/:id", (req, res) =>
  getModulemembersController(res, req.params.id, null)
);

// Modules
app.get("/api/modules", (req, res) => getModulesController(res, null, null));
app.get("/api/modules/:id(\\d+)", (req, res) =>
  getModulesController(res, req.params.id, null)
);
app.get("/api/modules/leader/:id", (req, res) =>
  getModulesController(res, req.params.id, "leader")
);
app.get("/api/modules/users/:id", (req, res) =>
  getModulesController(res, req.params.id, "users")
);

//Post Modules===================Post Modules==========================here======================================
app.post("/api/modules", postModulesController);
app.post("/api/modulemembers", postModulemembersController);

// Users
app.get("/api/users", (req, res) => getUsersController(res, null, null));
app.get("/api/users/:id(\\d+)", (req, res) =>
  getUsersController(res, req.params.id, null)
);
app.get("/api/users/student", (req, res) =>
  getUsersController(res, null, "student")
);
app.get("/api/users/staff", (req, res) =>
  getUsersController(res, null, "staff")
);
app.get("/api/users/groups/:id", (req, res) =>
  getUsersController(res, req.params.id, "groups")
);
//Groups
app.get("/api/groups", (req, res) => getGroupsController(res, null, null));
app.get("/api/groups/:id", (req, res) =>
  getGroupsController(res, req.params.id, null)
);

// Years
app.get("/api/years", (req, res) => getYearsController(res, null, null));
app.get("/api/years/:id", (req, res) =>
  getYearsController(res, req.params.id, null)
);

// Start server ----------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
