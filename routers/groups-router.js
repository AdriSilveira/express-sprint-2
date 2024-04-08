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

//Controllers-------------------------------------------------------
const postGroupsController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildGroupsCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createGroups(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
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
const getGroupsController = async (req, res, variant) => {
  const id = req.params.id;

  console.log("Hello World");
  //Validate reques

  // Access data
  const query = buildGroupsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};

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

//Endpoints-------------------------------------------------------
router.get("/", (req, res) => getGroupsController(req, res, null));
router.get("/:id", (req, res) => getGroupsController(req, res, null));
router.get("/modules/:id", (req, res) =>
  getGroupsController(req, res, "fetchgroups")
);
router.post("/", postGroupsController);
router.put("/:id", putGroupsController);
router.delete("/:id", deleteGroupsController);

export default router;
