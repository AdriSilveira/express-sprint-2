import { Router } from "express";
import database from "../database.js";

const router = Router();

//Query Builders-------------------------------------------------------
const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );

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
    "moduleImageURL",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildModulesUpdateQuery = (record, id) => {
  let table = "Modules";
  let mutableFields = [
    // "moduleID",REMOVE NOT NEEDED
    "moduleName",
    "moduleCode",
    "moduleLevel",
    "moduleYearID",
    "moduleLeaderID",
    "moduleImageURL",
  ];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE moduleID=:moduleID`;
  return { sql, data: { ...record, moduleID: id } };
};

const buildModulesDeleteQuery = (id) => {
  let table = "Modules";
  const sql = `DELETE FROM  ${table} 
        WHERE moduleID=:moduleID`;
  return { sql, data: { moduleID: id } };
};

//Data Accessors-------------------------------------------------------

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
const updateModules = async (updateQuery) => {
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

//Controllers-------------------------------------------------------
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
const postModulesController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildModulesCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createModules(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
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
  } = await updateModules(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
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

//Endpoints-------------------------------------------------------
router.get("/", (req, res) => getModulesController(req, res, "modules"));
router.get("/:id", (req, res) => getModulesController(req, res, null));
router.get("/leader/:id", (req, res) =>
  getModulesController(req, res, "leader")
);
router.get("/users/:id", (req, res) => getModulesController(req, res, "users"));
router.post("/", postModulesController);
router.put("/:id", putModulesController);
router.delete("/:id", deleteModulesController);

export default router;
