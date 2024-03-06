import { Router } from "express";
import database from "../database.js";

const router = Router();
//Query Builders-------------------------------------------------------
const buildUserModuleCreateQuery = (record) => {
  let table = "UserModule";
  let mutableFields = ["userModuleID", "userID", "moduleID"];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

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

//Data Accessors-------------------------------------------------------
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

//Controllers-------------------------------------------------------
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

//Endpoints-------------------------------------------------------

router.get("/", (req, res) => getUserModuleController(req, res, null));
router.get("/:id", (req, res) => getUserModuleController(req, res, null));
router.post("/", postUserModuleController);
//router.put("/:id", putUserModuleController);
//router.delete("/:id", deleteUserModuleController);
//Homework
export default router;
