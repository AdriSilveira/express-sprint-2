import { Router } from "express";
import database from "../database.js";
import { TransformStreamDefaultController } from "node:stream/web";

const router = Router();
//Query Builders-------------------------------------------------------
const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );
const buildYearsReadQuery = (id, variant) => {
  let table = "Years";
  let fields = ["yearID", "yearName"];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE yearID=:ID`;
  }

  return { sql, data: { ID: id } };
};
const buildYearsCreateQuery = (record) => {
  let table = "Years";
  let mutableFields = ["yearID", "yearName"];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};
const buildYearsDeleteQuery = (id) => {
  let table = "Years";
  const sql = `DELETE FROM  ${table} 
        WHERE yearID=:yearID`;
  return { sql, data: { yearID: id } };
};
const buildYearsUpdateQuery = (record, id) => {
  let table = "Years";
  let mutableFields = ["yearID", "yearName"];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE yearID=:yearID`;
  return { sql, data: { ...record, yearID: id } };
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
const createYears = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildYearsReadQuery(status[0].insertId, null);

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
const updateYears = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildYearsReadQuery(updateQuery.data.moduleID, null);
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
const deleteYears = async (deleteQuery) => {
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
const postYearsController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildYearsCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createYears(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const deleteYearsController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildYearsDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteYears(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Module deleted successfully");
  res.status(200).json({ message: accessorMessage });
};
const putYearsController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildYearsUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateYears(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
//Endpoints-------------------------------------------------------
router.get("/", (req, res) => getYearsController(req, res, null));
router.get("/:id", (req, res) => getYearsController(req, res, null));
router.post("/", postYearsController);
router.put("/:id", putYearsController);
router.delete("/:id", deleteYearsController);

export default router;
