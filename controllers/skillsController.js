import asyncHandler from "../middleware/asyncHandler.js";
import skillsRepository from "../repository/skillsRepository.js";

const formatSkills = (skillsDoc) => {
  if (!skillsDoc) {
    return null;
  }

  const doc = skillsDoc.toObject ? skillsDoc.toObject() : { ...skillsDoc };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

const normalizeStringArray = (values = []) =>
  values.map((value) => value.trim()).filter(Boolean);

const getAuthenticatedEmployeeId = (req, res) => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    res.status(400).json({
      success: false,
      message: "Employee ID not found for the authenticated user.",
    });
    return null;
  }
  return employeeId;
};

export const addSkills = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const existing = await skillsRepository.findByEmployeeId(employeeId);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Skills already exist. Use update instead.",
    });
  }

  const { skills, primarySkill, certifications, resumeUrl } = req.body;

  const skillsDoc = await skillsRepository.create({
    employeeId,
    skills: normalizeStringArray(skills ?? []),
    primarySkill: primarySkill?.trim() || null,
    certifications: normalizeStringArray(certifications ?? []),
    resumeUrl: resumeUrl?.trim() || null,
  });

  return res.status(201).json({
    success: true,
    message: "Skills added successfully.",
    skills: formatSkills(skillsDoc),
  });
});

export const getSkills = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const skillsDoc = await skillsRepository.findByEmployeeId(employeeId);
  if (!skillsDoc) {
    return res.status(404).json({
      success: false,
      message: "Skills not found.",
    });
  }

  return res.status(200).json({
    success: true,
    skills: formatSkills(skillsDoc),
  });
});

export const updateSkills = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const existing = await skillsRepository.findByEmployeeId(employeeId);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Skills not found.",
    });
  }

  const { skills, primarySkill, certifications, resumeUrl } = req.body;
  const updateData = {};

  if (skills !== undefined) {
    updateData.skills = normalizeStringArray(skills);
  }
  if (primarySkill !== undefined) {
    updateData.primarySkill = primarySkill?.trim() || null;
  }
  if (certifications !== undefined) {
    updateData.certifications = normalizeStringArray(certifications);
  }
  if (resumeUrl !== undefined) {
    updateData.resumeUrl = resumeUrl?.trim() || null;
  }

  const updated = await skillsRepository.updateByEmployeeId(
    employeeId,
    updateData,
  );

  return res.status(200).json({
    success: true,
    message: "Skills updated successfully.",
    skills: formatSkills(updated),
  });
});

export const deleteSkills = asyncHandler(async (req, res) => {
  const employeeId = getAuthenticatedEmployeeId(req, res);
  if (!employeeId) {
    return;
  }

  const deleted = await skillsRepository.deleteByEmployeeId(employeeId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Skills not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Skills deleted successfully.",
  });
});
