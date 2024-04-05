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
const buildAssessmentsCreateQuery = (record) => {
  let table = "AttendanceStatus";
  let mutableFields = ["attendanceStatusID", "status"];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildAssessmentsReadQuery = (id, variant) => {
  let table = "AttendanceStatus";
  let fields = ["attendanceStatusID", "status"];
  let sql = "";

  switch (variant) {
    default:
      let sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE attendanceStatusID=:ID`;
  }

  return { sql, data: { ID: id } };
};

const buildAssessmentsUpdateQuery = (record, id) => {
  let table = "AttendanceStatus";
  let mutableFields = ["attendanceStatusID", "status"];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE attendanceStatusID=:attendanceStatusID`;
  return { sql, data: { ...record, assessmentID: id } };
};

const buildAssessmentsDeleteQuery = (id) => {
  let table = "AttendanceStatus";
  const sql = `DELETE FROM  ${table} 
        WHERE attendanceStatusID=:attendanceStatusID`;
  return { sql, data: { assessmentID: id } };
};

//Data Accessors-------------------------------------------------------

const createAttendanceStatus = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildAttendanceStatusReadQuery(status[0].insertId, null);

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

const updateAttendanceStatus = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildAttendanceStatusReadQuery(
      updateQuery.data.assessmentID,
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

const deleteAttendanceStatus = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.attendanceStatusID}`,
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
const getAttendanceStatusController = async (req, res, variant) => {
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
    const query = buildAttendanceStatusReadQuery(id, variant);
    // build ReadQuery(id, variant) + ` LIMIT ${offset}, ${pageSize}`;
    console.log("test query" + query);
    const { isSuccess, result, message: accessorMessage } = await read(query);

    if (!isSuccess) {
      console.error("Error in accessing data:", accessorMessage);
      return res.status(404).json({ message: accessorMessage });
    }

    // Response to request
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAttendanceStatusController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const postAttendanceStatusController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildAttendanceStatusCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createAttendanceStatus(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putAttendanceStatusController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildAttendanceStatusUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateAttendanceStatus(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteAttendanceStatusController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildAttendanceStatusDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteAttendanceStatus(query);
  if (!isSuccess) {
    console.error("Error deleting attendance: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("attendance deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) =>
  getAttendanceStatusController(req, res, "attendanceStatus")
);
router.get("/:id", (req, res) => getAttendanceStatusController(req, res, null));

//router.get("/users/:id", (req, res) => getAssessmentsController(req, res, "users"));
router.post("/", postAttendanceStatusController);
router.put("/:id", putAttendanceStatusController);
router.delete("/:id", deleteAttendanceStatusController);

export default router;
