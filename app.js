// Imports --------------Connected with GIT-------------------------
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

const buildModulesUpdateSql = () => {
  let table = "Modules";
  let mutableFields = [
    // "moduleID",
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    "moduleImageURL",
  ];

  return (
    // "UPDATE Modules "
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE moduleID=:moduleID`
  );
};

const buildModulemembersInsertSql = () => {
  let table = "UserModule";
  let mutableFields = ["userModuleID", "userID", "moduleID"];
  return `INSERT INTO ${table} ` + buildSetFields(mutableFields);
};

const buildModulesInsertSql = () => {
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

  return `INSERT INTO ${table} ` + buildSetFields(mutableFields);
};
console.log("Here");
//=========here to fix?============
const buildModulemembersSelectSql = (id, variant) => {
  let table =
    "(UserModule LEFT JOIN Users ON UserModule.userID = Users.userID) LEFT JOIN Modules ON UserModule.moduleID = Modules.moduleID";
  let fields = [
    "userModuleID",
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

const buildModulesSelectSql = (id, variant) => {
  let table =
    "((Modules LEFT JOIN Users ON moduleLeaderID=userID) LEFT JOIN Years ON moduleYearID=yearID)";
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
    // "UserYearName",
    "userTypeID",
    "userImageURL",
    // Specify the table alias for userTypeID
    "CONCAT(userFirstName, ' ', userLastName) AS userName, UserType.userTypeID", //added last
  ];
  let sql = "";

  const Student = 1; // Primary key for student type in my database
  const Staff = 2; // Primary key for staff
  const Lecturer = 3; // Primary key for lecturer type in my database
  const Professor = 4;
  const Academic_Mentor = 6;
  const Module_Leader = 7;
  //const Admin = 5; DELETED
  switch (variant) {
    case "student":
      sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Student}`;
      break;
    case "staff":
      sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Staff}`;
      break;
    case "lecturer":
      sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Lecturer}`;
      break;
    case "professor":
      sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Professor}`;
      break;
    case "mentor":
      sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Academic_Mentor}`;
      break;
    case "leader":
      sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Module_Leader}`;
      break;

    // case "admin":
    //   sql = `SELECT ${fields} FROM ${table} WHERE userTypeID=${Admin}`;
    //   break;
    case "groups":
      table = `GroupMembers INNER JOIN ${table} ON GroupMembers.groupMemberID=Users.userID`;
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
  let fields = ["yearID", "yearName", "yearStart", "yearEnd"];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE moduleID=${id}`;
  }

  return sql;
};
//Build Groups ----------HERE-------------HERE-----------------
const buildGroupsSelectSql = (id, variant) => {
  let table = "Groups";
  let fields = [
    "groupID",
    "groupName",
    "groupModuleName",
    "assessmentID",
    "currentGrade",
  ];
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

const UpdateModules = async (sql, id, record) => {
  try {
    const status = await database.query(sql, { ...record, ModuleID: id });

    const recoverRecordSql = buildModulesSelectSql(id, null);

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
          message: `Failed to recover the updated record: ${message}`,
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
  const sql = buildModulemembersInsertSql();
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
//=============GETMODULESCONTROLLER=============
//POST MODULE CONTROLLER-----------------------------------------
const postModulesController = async (req, res) => {
  // Validate request

  // Access data
  const sql = buildModulesInsertSql();
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createModules(sql, req.body);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

//------------------------PUT MOdules controller--------------------------

const putModulesController = async (req, res) => {
  // Validate request
  const id = req.params.id;
  const record = req.body;

  // Access data
  const sql = buildModulesUpdateSql();
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await UpdateModules(sql, id, record);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
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

const getModulesController = async (res, id, variant) => {
  // Validate request

  // Access data
  const sql = buildModulesSelectSql(id, variant);
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
app.get(
  "/api/modulemembers",
  (req, res) => getModulemembersController(res, null, null) //nedd to change this two I think
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
// app.post("/api/modulemembers", postModulemembersController);

//PUT or UPDATE
app.put("/api/modules/:id", putModulesController);

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
app.get("/api/users/lecturer", (req, res) =>
  getUsersController(res, null, "lecturer")
);
app.get("/api/users/professor", (req, res) =>
  getUsersController(res, null, "professor")
);
app.get("/api/users/admin", (req, res) =>
  getUsersController(res, null, "admin")
);
app.get("/api/users/mentor", (req, res) =>
  getUsersController(res, null, "mentor")
);
app.get("/api/users/leader", (req, res) =>
  getUsersController(res, null, "leader")
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
