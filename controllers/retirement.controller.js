const pool = require("../config/db");
const dayjs = require("dayjs");

function calculateRetirement(teacher) {
  const today = dayjs();

  const dob = teacher.date_of_birth ? dayjs(teacher.date_of_birth) : null;
  const joined = teacher.hire_date ? dayjs(teacher.hire_date) : null;
  const retirementAge = 60; // policy (adjust if needed)

  let currentAge = null;
  let serviceYears = null;
  let retirementDate = null;
  let yearsLeft = null;

  if (dob && dob.isValid()) {
    currentAge = today.diff(dob, "year");
    retirementDate = dob.add(retirementAge, "year");
    yearsLeft = retirementDate.diff(today, "year");
  }

  if (joined && joined.isValid()) {
    serviceYears = today.diff(joined, "year");
  }

  return {
    ...teacher,
    current_age: currentAge,
    service_years: serviceYears,
    retirement_date: retirementDate ? retirementDate.format("YYYY-MM-DD") : null,
    years_left: yearsLeft > 0 ? yearsLeft : 0,
    status: yearsLeft > 0 ? "Active" : "Eligible for retirement",
  };
}

// Get all teachers with retirement details
exports.getAllTeachersRetirement = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, date_of_birth, hire_date
         FROM users
        WHERE role = 'teacher' AND deleted_at IS NULL`
    );

    const data = rows.map(calculateRetirement);
    res.json(data);
  } catch (err) {
    console.error("Retirement fetch error:", err);
    res.status(500).json({ message: "Error fetching retirement details" });
  }
};

// Get a single teacher’s retirement details
exports.getTeacherRetirement = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [[teacher]] = await pool.query(
      `SELECT id, full_name, email, date_of_birth, hire_date
         FROM users 
        WHERE id = ? AND role = 'teacher' AND deleted_at IS NULL
        LIMIT 1`,
      [teacherId]
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(calculateRetirement(teacher));
  } catch (err) {
    console.error("Retirement fetch error:", err);
    res.status(500).json({ message: "Error fetching teacher retirement" });
  }
};
