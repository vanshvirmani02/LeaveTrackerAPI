import asyncHandler from "../middleware/asyncHandler.js";
import salaryRepository from "../repository/salaryRepository.js";

const formatSalary = (salary) => {
  if (!salary) {
    return null;
  }

  const doc = salary.toObject ? salary.toObject() : { ...salary };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

export const getMySalary = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
  }

  const salary = await salaryRepository.findLatestByEmployeeId(employeeId);
  if (!salary) {
    return res.status(404).json({
      success: false,
      message: "Salary details not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Salary retrieved successfully.",
    salary: formatSalary(salary),
  });
});
