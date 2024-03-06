import express, { query } from "express";
import cors from "cors";
import database from "./database.js";

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

//SQL
//==========================================MODULES============================================
const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );

const buildModulesDeleteQuery = (id) => {
  let table = "Modules";
  const sql = `DELETE FROM  ${table} 
      WHERE moduleID=:moduleID`;
  return { sql, data: { moduleID: id } };
};
//Building modules without the ID what will be added automacally by the database
const buildModulesUpdateQuery = (record, id) => {
  let table = "Modules";
  let mutableFields = [
    // "moduleID",REMOVE NOT NEEDED
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID", //userModuleID
    "moduleImageURL",
  ];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE moduleID=:moduleID`;
  return { sql, data: { ...record, moduleID: id } };
};

const buildModulesReadQuery = (id, variant) => {
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
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE moduleID=:ID`;
      break;

    case "leader":
      sql = `SELECT ${fields} FROM ${table} WHERE moduleLeaderID=:ID`;
      break;
    case "users":
      table = `UserModule INNER JOIN ${table} ON UserModule.userModuleID=Modules.moduleID`;
      sql = `SELECT ${fields} FROM ${table} WHERE userModuleID=:ID`;
      break;
    case "modules":
      sql = `SELECT ${fields} FROM ${table}`;
      console.log("test test" + sql);
      break;
  }

  return { sql, data: { ID: id } };
};

const buildModulesCreateQuery = (record) => {
  let table = "Modules";
  let mutableFields = [
    "moduleID",
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    //"moduleLeaderName",
    "moduleImageURL",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

//================================================USERMODULE=================================================
const buildUserModuleReadQuery = (id, variant) => {
  let table =
    "(UserModule LEFT JOIN Users ON UserModuleUserID = Users.userID) LEFT JOIN Modules ON UserModule.moduleID = Modules.moduleID";
  let fields = [
    "userModuleID",
    "UserModulemoduleID",
    'CONCAT(Modules.moduleCode," ",Modules.moduleName) AS moduleName',
    "UserModuleuserID",
    'CONCAT(Users.userFirstName," ",Users.userLastName) AS userName',
  ];
  let sql = "";

  switch (variant) {
    default:
      const sql = `SELECT ${fields.join(", ")} FROM ${table}`;
      if (id) sql += ` WHERE UserModule.userModuleID=:ID`;
  }
  return { sql, data: { ID: id } };
};
//console.log("generated SQL:" + sql);
//console.log("Data:", { ID: id });

const buildUserModuleCreateQuery = (record) => {
  let table = "UserModule";
  let mutableFields = ["userModuleID", "userID", "moduleID"];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

//================================================USERS=================================================
const buildUsersReadQuery = (id, variant) => {
  let table = "Users";
  let fields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    "userImageURL",
    // Specify the table alias for userTypeID
    //"CONCAT()",
    //"CONCAT(userFirstName, ' ', userLastName) AS userName",
  ];
  let fields2 = [
    "Users.userID",
    "Users.userFirstName",
    "Users.userLastName",
    "Users.userEmail",
    "Users.userLevel",
    "Users.userYearID",
    "Users.userTypeID",
    "Users.userImageURL",
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
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Student}`;
      break;
    case "staff":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Staff}`;
      break;
    case "lecturer":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Lecturer}`;
      break;
    case "professor":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Professor}`;
      break;
    case "mentor":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Academic_Mentor}`;
      break;
    case "leader":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Module_Leader}`;
      break;
    case "groups":
      console.log("does this reatch");
      sql = `SELECT ${fields2}
                FROM Users 
                INNER JOIN	GroupMember ON Users.userID = GroupMember.userID
                WHERE GroupMember.groupID =:ID`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE userID=:ID`;
  }
  return { sql, data: { ID: id } };
};

const buildUsersDeleteQuery = (id) => {
  let table = "Users";
  const sql = `DELETE FROM  ${table} 
      WHERE userID=:userID`;
  return { sql, data: { userID: id } };
};
const buildUsersUpdateQuery = (record, id) => {
  let table = "Users";
  let mutableFields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    "userImageURL",
  ];

  const sql =
    // "UPDATE Users "
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE userID=:userID`;
  return { sql, data: { ...record, userID: id } };
};
const buildUsersCreateQuery = (record) => {
  let table = "Users";
  let mutableFields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    "userImageURL",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

//================================================YEARS=================================================
const buildYearsReadQuery = (id, variant) => {
  let table = "Years";
  let fields = ["yearID", "yearName"];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE moduleID=:ID`;
  }

  return { sql, data: { ID: id } };
};
//================================================GROUPS=================================================
const buildGroupsReadQuery = (id, variant) => {
  let table = "Groups";
  let fields = [
    "groupID",
    "groupName",
    "groupModuleName",
    "currentGrade",
    "moduleID",
    "assessmentID",
  ];
  let fields2 = [
    `Groups.groupID, Groups.groupName, Groups.groupModuleName, Groups.assessmentID, Groups.currentGrade, Groups.ModuleID`,
  ];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE GroupID=:ID`;
      break;
    case "fetchgroups":
      sql = `SELECT ${fields2} FROM Groups INNER JOIN Modules ON Groups.moduleID=Modules.moduleID WHERE Groups.moduleID=:ID `;
      break;
  }
  return { sql, data: { ID: id } };
};

const buildGroupsUpdateQuery = (record, id) => {
  let table = "Groups";
  let fields = [
    "groupName",
    "groupModuleName",
    "currentGrade",
    "moduleID",
    "assessmentID",
  ];
  let fields2 = [
    `Groups.groupID, Groups.groupName, Groups.groupModuleName, Groups.assessmentID, Groups.currentGrade, Groups.ModuleID`,
  ];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE GroupID=${id}`;
      break;
    case "fetchgroups":
      sql = `SELECT ${fields2} FROM Groups INNER JOIN Modules ON Groups.moduleID=Modules.moduleID WHERE Groups.moduleID= ${id} `;
      break;
  }
  return { sql, data: { ...record, userID: id } };
};
const buildGroupsDeleteQuery = (id) => {
  let table = "Groups";
  const sql = `DELETE FROM  ${table} 
      WHERE groupID=:groupID`;
  return { sql, data: { groupID: id } };
};
const buildGroupsCreateQuery = (record) => {
  let table = "Groups";
  let mutableFields = [
    "groupID",
    "groupName",
    "groupModuleName",
    "currentGrade",
    "moduleID",
    "assessmentID",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

// =========================================POST CONTROLLERS =====================================
//POST MODULES
const postModulesController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildModulesCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createUserModule(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

//POST Groups
const postGroupsController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const sql = buildGroupsCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createGroups(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

//POST USERS
const postUsersController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildUsersCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createUsers(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

//POST MODULES MEMBERS
const postUserModuleController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildUserModuleCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createUserModule(sql, record);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};

//================================DELETE CONTROLLERS=============================================
// DELETE MODULES
const deleteModulesController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildModulesDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteModules(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Module deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//DELETE GROUPS
const deleteGroupsController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildGroupsDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteGroups(query);
  if (!isSuccess) {
    console.error("Error deleting group: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Group deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//DELETE USERS
const deleteUsersController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildUsersDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteUsers(query);
  if (!isSuccess) {
    console.error("Error deleting user: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("User deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//========================================GET CONTROLLERS==========================================
//GET MODULES
const getModulesController = async (req, res, variant) => {
  const id = req.params.id;
  try {
    if (!res || !res.status) {
      console.error("Invalid 'res' object:", res);
      return res.status(400).json({ message: "Internal Server Error" });
    }
    // with this code I aim controlling the number of data is being display in the interface.
    const page = req.query && req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = parseInt(req.query.pageSize) || 15;

    const offset = (page - 1) * pageSize;

    // Access data
    console.log(id);
    console.log("test variant" + variant);
    const query = buildModulesReadQuery(id, variant);
    // buildModulesReadQuery(id, variant) + ` LIMIT ${offset}, ${pageSize}`;
    console.log("test query" + query);
    const { isSuccess, result, message: accessorMessage } = await read(query);

    if (!isSuccess) {
      console.error("Error in accessing data:", accessorMessage);
      return res.status(404).json({ message: accessorMessage });
    }

    // Response to request
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getModulesController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//GET GROUPS
const getGroupsController = async (req, res, variant) => {
  const id = req.params.id;
  //Validate reques

  // Access data
  const query = buildGroupsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

//GET USERS
const getUsersController = async (req, res, variant) => {
  const id = req.params.id;

  // Validate request
  console.log("This is test" + id, variant);
  // Access data
  const query = buildUsersReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

//GET MODULEMEMBER
const getUserModuleController = async (req, res, variant) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildUserModuleReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

const getYearsController = async (req, res, variant) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildYearsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

//======================================PUT CONTROLLERS========================================================
//PUT MODULES
const putModulesController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildModulesUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await UpdateModules(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

//PUT GROUPS
const putGroupsController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildGroupsUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await UpdateGroups(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

//PUT USERS
const putUsersController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildUsersUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await UpdateUsers(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
//=========================================================MODULES==========================================================

const deleteModules = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.moduleID}`,
        }
      : {
          isSuccess: true,
          result: null,
          message: "Record successfully deleted",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const UpdateModules = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }

    const readQuery = buildModulesReadQuery(updateQuery.data.moduleID, null);
    const { isSuccess, result, message } = await read(readQuery);

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
const createModules = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildModulesReadQuery(status[0].insertId, null);

    const { isSuccess, result, message } = await read(readQuery);

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

const read = async (query) => {
  try {
    const [result] = await database.query(query.sql, query.data);
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

//=============================================USERMODULE===================================================================

const createUserModule = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildUserModuleReadQuery(status[0].insertId, null);

    const { isSuccess, result, message } = await read(readQuery);

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
//=============================================GROUPS===================================================================
const deleteGroups = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.groupID}`,
        }
      : {
          isSuccess: true,
          result: null,
          message: "Record successfully deleted",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const UpdateGroups = async (sql, id, record) => {
  try {
    const status = await database.query(sql, { ...record, groupID: id });

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }

    const recoverRecordSql = buildGroupsSelectSql(id, null);

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
const createGroups = async (sql, record) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildGroupsSelectSql(status[0].insertId, null);

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

//====================================USERS==============================================================================

const UpdateUsers = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }

    const readQuery = buildUsersReadQuery(
      updateQuery.sql,
      updateQuery.data,
      null
    );

    const { isSuccess, result, message } = await read(readQuery);

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
const createUsers = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildUsersReadQuery(status[0].insertId, null);

    const { isSuccess, result, message } = await read(readQuery);

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
const deleteUsers = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.userID}`,
        }
      : {
          isSuccess: true,
          result: null,
          message: "Record successfully deleted",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

// ----------------------------Endpoints -------------------------------------

//MODULES
app.get("/api/modules", (req, res) =>
  getModulesController(req, res, "modules")
);
app.get("/api/modules/:id", (req, res) => getModulesController(req, res, null));
app.get("/api/modules/leader/:id", (req, res) =>
  getModulesController(req, res, "leader")
);
app.get("/api/modules/users/:id", (req, res) =>
  getModulesController(req, res, "users")
);
app.post("/api/modules", postModulesController);
app.put("/api/modules/:id", putModulesController);
app.delete("/api/modules/:id", deleteModulesController);

//USERS
app.get("/api/users", (req, res) => getUsersController(req, res, null));
app.get("/api/users/:id(\\d+)", (req, res) =>
  getUsersController(req, res, null)
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
// app.get("/api/users/admin", (req, res) =>
//   getUsersController(res, null, "admin")
// );
app.get("/api/users/mentor", (req, res) =>
  getUsersController(res, null, "mentor")
);
app.get("/api/users/leader", (req, res) =>
  getUsersController(res, null, "leader")
);
app.get("/api/users/groups/:id", (req, res) =>
  getUsersController(req, res, "groups")
);
app.post("/api/users", postUsersController);
app.put("/api/users/:id", putUsersController);
app.delete("/api/users/:id", deleteUsersController);

//GROUPS
app.get("/api/groups", (req, res) => getGroupsController(req, res, null));
app.get("/api/groups/:id", (req, res) => getGroupsController(req, res, null));
app.get("/api/groups/modules/:id", (req, res) =>
  getGroupsController(req, res, "fetchgroups")
);
app.post("/api/groups", postGroupsController);
app.put("/api/groups/:id", putGroupsController);
app.delete("/api/groups/:id", deleteGroupsController);

//YEARS
app.get("/api/years", (req, res) => getYearsController(req, res, null));
app.get("/api/years/:id", (req, res) => getYearsController(req, res, null));

// UserModule
//I have changed modulemembers to usermodule, to maintain name consistence====
app.get(
  "/api/usermodule",
  (req, res) => getUserModuleController(req, res, null) //nedd to change this two I think
);
app.get("/api/usermodule/:id", (req, res) =>
  getUserModuleController(req, res, null)
);
app.post("/api/usermodule", postUserModuleController);
//app.put("/api/usermodule/:id", putUserModuleController);
//app.delete("/api/usermodule/:id", deleteUserModuleController);
//Homework
//Contribution
//Assessments

// Start server ----------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
