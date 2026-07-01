import asyncHandler from "../middleware/asyncHandler.js";
import userRepository from "../repository/userRepository.js";
import { ROLES } from "../config/constants.js";

const formatTeamMember = (member) => ({
  id: member._id?.toString(),
  name: member.name,
  designation: member.designation ?? null,
  status: member.status,
});

const formatManager = (manager) => {
  const { _id, teamCount, teamMembers, ...rest } = manager;
  return {
    ...rest,
    id: _id?.toString(),
    teamCount,
    teamMembers: (teamMembers || []).map(formatTeamMember),
  };
};

export const getManagersList = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  const managers = await userRepository.findAllManagersIdAndName();

  if (managers.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No managers found.",
      managers: [],
    });
  }

  res.status(200).json({
    success: true,
    count: managers.length,
    managers: managers.map((manager) => ({
      id: manager._id.toString(),
      name: manager.name,
    })),
  });
});

export const getAllManagers = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  const managers = await userRepository.findAllManagersWithTeamCount();

  if (managers.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No managers assigned to any employee.",
      managers: [],
    });
  }

  res.status(200).json({
    success: true,
    count: managers.length,
    managers: managers.map(formatManager),
  });
});
