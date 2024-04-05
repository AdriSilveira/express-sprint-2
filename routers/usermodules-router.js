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

const buildUserModuleReadQuery = (id, variant) => {
  let table =
    "(UserModule LEFT JOIN Users ON UserModule.userID = Users.userID) LEFT JOIN Modules ON UserModule.moduleID = Modules.moduleID";
  let fields = [
    "userModuleID",
    "UserModule.moduleID",
    'CONCAT(Modules.moduleCode," ",Modules.moduleName) AS moduleName',
    "UserModule.userID",
    'CONCAT(Users.userFirstName," ",Users.userLastName) AS userName',
  ];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields.join(", ")} FROM ${table}`;
      if (id) sql += ` WHERE UserModule.userModuleID=:ID`;
  }
  return { sql, data: { ID: id } };
};
const buildUserModuleCreateQuery = (record) => {
  let table = "UserModule";
  let mutableFields = ["userModuleID", "userID", "moduleID"];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};
const buildUserModuleUpdateQuery = (record, id) => {
  let table = "UserModule";
  let mutableFields = ["userID", "moduleID"];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE userModuleID=:userModuleID`;
  return { sql, data: { ...record, userModuleID: id } };
};
const buildUserModuleDeleteQuery = (id) => {
  let table = "UserModule";
  const sql = `DELETE FROM  ${table} 
        WHERE UserModuleID=:UserModuleID`;
  return { sql, data: { UserModuleID: id } };
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
const updateUserModule = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildUserModuleReadQuery(
      updateQuery.data.UserModuleID,
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
const deleteUserModule = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.UserModuleID}`,
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

const postUserModuleController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildUserModuleCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createUserModule(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putUserModuleController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildUserModuleUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateUserModule(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteUserModuleController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildUserModuleDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteUserModule(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------

router.get("/", (req, res) => getUserModuleController(req, res, null));
router.get("/:id", (req, res) => getUserModuleController(req, res, null));
router.post("/", postUserModuleController);
router.put("/:id", putUserModuleController);
router.delete("/:id", deleteUserModuleController);

export default router;
