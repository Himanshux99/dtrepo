const BRANCH_MAP = {
  101: "Information Technology (IT)",
  102: "Computer Engineering (CMPN)",
  104: "Electronics & Telecommunication (EXTC)",
  108: "Electronics & Computer Science (EXCS)",
};

const BRANCH_SHORT_MAP = {
  101: "IT",
  102: "CMPN",
  104: "EXTC",
  108: "EXCS",
};

// Add the 'export' keyword here
export const extractUsernameFromEmail = (email) => {
  if (!email || !email.includes("@")) return "N/A";
  const localPart = email.split("@")[0];
  const nameParts = localPart.split(".");
  if (nameParts.length < 2) return "N/A";
  const firstName = nameParts[0];
  const lastName = nameParts[1].replace(/[0-9]/g, "");
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
};

export const decodeRollNumber = (rollNumber, email) => {
  if (!rollNumber || rollNumber.length !== 10) {
    return { error: "Invalid Roll Number format." };
  }

  const admissionYearShort = parseInt(rollNumber.substring(0, 2), 10);
  const branchCode = rollNumber.substring(2, 5);
  const division = rollNumber.substring(5, 6);
  const specificRollNo = rollNumber.substring(6);
  const admissionYear = 2000 + admissionYearShort;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  let academicYear = currentYear - admissionYear;
  if (currentMonth < 7) {
    academicYear = currentYear - admissionYear - 1;
  }
  academicYear += 1;

  let semester = null;
  if (currentMonth >= 7 && currentMonth <= 12) {
    semester = academicYear * 2 - 1;
  } else if (currentMonth >= 1 && currentMonth <= 4) {
    semester = academicYear * 2;
  } else {
    semester = "Vacation";
  }

  return {
    username: extractUsernameFromEmail(email),
    admissionYear,
    branch: BRANCH_MAP[branchCode] || "Unknown Branch",
    branchShortName: BRANCH_SHORT_MAP[branchCode] || "UNKNOWN",
    division,
    specificRollNo,
    rollNumber,
    currentAcademicYear: academicYear > 4 ? "Graduated" : academicYear,
    currentSemester: semester,
  };
};
