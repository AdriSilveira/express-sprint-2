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
  let table = "GroupMemberAttendance";
  let mutableFields = [
    "attendanceID",
    "groupMemberID",
    "contributionID",
    "attendanceStatusID",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildAssessmentsReadQuery = (id, variant) => {
  let table = "GroupMemberAttendance";
  let fields = [
    "attendanceID",
    "groupMemberID",
    "contributionID",
    "attendanceStatusID",
  ];
  let sql = "";

  switch (variant) {
    default:
      let sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE attendanceID=:ID`;
  }

  return { sql, data: { ID: id } };
};

const buildAssessmentsUpdateQuery = (record, id) => {
  let table = "GroupMemberAttendance";
  let mutableFields = [
    "attendanceID",
    "groupMemberID",
    "contributionID",
    "attendanceStatusID",
  ];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE attendanceID=:attendanceID`;
  return { sql, data: { ...record, attendanceID: id } };
};

const buildAssessmentsDeleteQuery = (id) => {
  let table = "GroupMemberAttendance";
  const sql = `DELETE FROM  ${table} 
        WHERE attendanceID=:attendanceID`;
  return { sql, data: { attendanceID: id } };
};

//Data Accessors-------------------------------------------------------

const createGroupMemberAttendance = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildGroupMemberAttendanceReadQuery(
      status[0].insertId,
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

const updateGroupMemberAttendance = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildGroupMemberAttendanceReadQuery(
      updateQuery.data.attendanceID,
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

const deleteGroupMemberAttendance = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.attendanceID}`,
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
const getGroupMemberAttendanceController = async (req, res, variant) => {
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
    const query = buildGroupMemberAttendanceReadQuery(id, variant);
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
    console.error("Error in getGroupMemberAttendanceController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const postGroupMemberAttendanceController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildGroupMemberAttendanceCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createGroupMemberAttendance(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putGroupMemberAttendanceController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildGroupMemberAttendanceUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateGroupMemberAttendance(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteGroupMemberAttendanceController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildGroupMemberAttendanceDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteGroupMemberAttendance(query);
  if (!isSuccess) {
    console.error("Error deleting Assessment: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Assessment deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) =>
  getGroupMemberAttendanceController(req, res, "groupMemberAttendance")
);
router.get("/:id", (req, res) =>
  getGroupMemberAttendanceController(req, res, null)
);

//router.get("/users/:id", (req, res) => getAssessmentsController(req, res, "users"));
router.post("/", postGroupMemberAttendanceController);
router.put("/:id", putGroupMemberAttendanceController);
router.delete("/:id", deleteGroupMemberAttendanceController);

export default router;
