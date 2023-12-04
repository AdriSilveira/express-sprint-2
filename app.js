//Imports-----------------------------------------
import express from "express";
import database from "./database.js";

//Configure express app---------------------------
const app = express();

//configure midleware-----------------------------
app.use(function (req, res, next) {
  // set headers to allow cross-origin requests
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  // allow all HTTP methods
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  // continue with the next middleware in the stack
  next();
});
//Controllers-------------------------------------=============================================
const createModule = async (sql, record) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildModulesSelectSql(status[0].insertId, null);

    const { isSuccess, result, message } = await read(recoverRecordSql);
    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recoverd",
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
      message: `Failed to execute query 1: ${error.message}`,
    };
  }
};

const createUsersModule = async (sql, recover) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildUsersInsertSql(status[0].insertId, null);

    const { isSuccess, result, message } = await read(recoverRecordSql);
    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recoverd",
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
      message: `Failed to execute query 2: ${error.message}`,
    };
  }
};

const read = async (sql) => {
  try {
    console.log(`sql=[${sql}]`);
    const [result] = await database.query(sql);
    console.log(`result=[${result.length}]`);
    return result.length === 0
      ? { isSuccess: false, result: null, message: "No records(s) found" }
      : { isSuccess: true, result: result, message: "Record(s) found" };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query 3: ${error.message}`,
    };
  }
};
//INSERT===============================================================================
const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ","),
    "SET"
  );

const buildModulesInsertSql = (record) => {
  let table = "Modules";
  let mutableFields = [
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    "moduleImageURL",
    "moduleLeaderName",
  ];
  return `INSERT INTO ${table} ` + buildSetFields(mutableFields);
};

const buildModulesSelectSql = (id, variant) => {
  let sql = "";
  const table =
    "(Modules LEFT JOIN Users ON Modules.moduleLeaderID=Users.userID)";
  const fields = [
    "moduleID",
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    "moduleImageURL",
    "CONCAT(userFirstName,'',userLastName) AS moduleLeaderName",
  ];
  switch (variant) {
    case "leader":
      sql = `SELECT ${fields} FROM ${table} WHERE moduleLeaderID=${id}`;
      break;
    case "users":
      const extendedTable = `UserModule INNER JOIN ${table} ON UserModule.moduleID=moduleID`;
      sql = `SELECT ${fields} FROM ${extendedTable} WHERE userID=${id}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE ModuleID=${id}`;
  }
  return sql;
};

const getmodulesController = async (req, res, variant) => {
  console.log("getmodulesController");
  const id = req.params.id; //undefined in the case of the /api/modules endpoint
  console.log(`id=[${id}]`);
  //Access data
  const sql = buildModulesSelectSql(id, variant);
  console.log(`sql=[${sql}]`);
  const { isSuccess, result, message } = await read(sql);
  console.log(`isSuccess=[${isSuccess}]`);
  if (!isSuccess) return res.status(404).json({ message });

  //Responses
  res.status(200).json(result);
};
//=================Insert============POST===========
const postUserModulesController = async (req, res) => {
  //Validate request

  //Access data
  const sql = buildUsersInsertSql(req.body);
  const {
    isSuccess,
    result,
    message: accessonMessage,
  } = await createUsersModule(sql, req.body);
  if (!isSuccess) return res.status(400).json({ message: accessonMessage });
  //Response to request
  res.status(201).json(result);
};

const postmodulesController = async (req, res) => {
  //Access data
  const sql = buildModulesInsertSql(req.body);
  const { isSuccess, result, message } = await createModule(sql, req.body);
  if (!isSuccess) return res.status(404).json({ message });

  //Responses
  res.status(201).json(result);
};

//USERS=====================

//STARTING USER CONTROLLERS==============================================================

const buildUsersSelectSql = (id, variant) => {
  let sql = "";
  const table =
    "(Users LEFT JOIN UserType ON Users.UserTypeID=UserType.UserTypeID) LEFT JOIN Years ON Users.UserYearID=Years.YearID";
  const fields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userRole",
    "userYearName",
    "userImageURL",
    ,
  ];
  switch (variant) {
    case "student":
      const STUDENT = 2; //USER TYPE RECORD FOR STUDENT
      sql = `SELECT ${fields} FROM ${table} WHERE userRole=${STUDENT}`;
      break;

    case "staff":
      const STAFF = 1; //userRole record for student( professor, Lecturer,student, module leader)
      sql = `SELECT ${fields} FROM ${table} WHERE UserRole=${STAFF}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE UserID=${id}`;
  }
  return sql;
};
const getUsersController = async (req, res, variant) => {
  const id = req.params.id; //undefined in the case of the /api/modules/endpoint
  //Validate request
  //Access data
  const sql = buildUsersSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);
  if (!isSuccess) return res.status(404).json({ message });

  //Responses
  res.status(200).json(result);
};

//Endpoints---------------------------------------
app.get("/api/modules", (req, res) => getmodulesController(req, res, null));
app.get("/api/modules/:id(\\d+)", (req, res) =>
  getmodulesController(req, res, null)
);
app.get("/api/modules/leader/:id", (req, res) =>
  getmodulesController(req, res, "leader")
);
app.get("/api/modules/users/:id", (req, res) =>
  getmodulesController(req, res, "users")
);

//Post
app.post("/api/usermodule", postUserModulesController);

app.post("/api/modules", postmodulesController);

//Users
app.get("/api/users", (req, res) => getUsersController(req, res, null));
app.get("/api/users/:id(\\d+)", (req, res) =>
  getUsersController(req, res, null)
);
app.get("/api/users/student", (req, res) =>
  getUsersController(req, res, student)
);
app.get("/api/users/staff", (req, res) => getUsersController(req, res, staff));

//Years

//Start Server------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
