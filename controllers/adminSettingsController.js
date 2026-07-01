import asyncHandler from "../middleware/asyncHandler.js";
import adminSettingsRepository from "../repository/adminSettingsRepository.js";

const formatAdminSettings = (adminSettings) => {
  const doc = adminSettings.toObject
    ? adminSettings.toObject()
    : { ...adminSettings };
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

const buildUpdateData = (organization, leaveSettings) => {
  const updateData = {};

  if (organization) {
    if (organization.organizationName !== undefined) {
      updateData["organization.organizationName"] =
        organization.organizationName.trim();
    }
    if (organization.timezone !== undefined) {
      updateData["organization.timezone"] = organization.timezone.trim();
    }
    if (organization.fiscalYearStart !== undefined) {
      updateData["organization.fiscalYearStart"] = organization.fiscalYearStart;
    }
  }

  if (leaveSettings) {
    if (leaveSettings.weekendAsWorkingDay !== undefined) {
      updateData["leaveSettings.weekendAsWorkingDay"] =
        leaveSettings.weekendAsWorkingDay;
    }
    if (leaveSettings.autoApproveSickLeave !== undefined) {
      updateData["leaveSettings.autoApproveSickLeave"] =
        leaveSettings.autoApproveSickLeave;
    }
    if (leaveSettings.emailNotification !== undefined) {
      updateData["leaveSettings.emailNotification"] =
        leaveSettings.emailNotification;
    }
  }

  return updateData;
};

export const addAdminSettings = asyncHandler(async (req, res) => {
  const { organization, leaveSettings } = req.body;

  const existingSettings = await adminSettingsRepository.findByOrganizationName(
    organization.organizationName,
  );
  if (existingSettings) {
    return res.status(400).json({
      success: false,
      message: "Admin settings for this organization already exist.",
    });
  }

  const adminSettings = await adminSettingsRepository.createAdminSettings({
    organization: {
      organizationName: organization.organizationName.trim(),
      timezone: organization.timezone.trim(),
      fiscalYearStart: organization.fiscalYearStart,
    },
    leaveSettings: {
      weekendAsWorkingDay: leaveSettings?.weekendAsWorkingDay ?? false,
      autoApproveSickLeave: leaveSettings?.autoApproveSickLeave ?? false,
      emailNotification: leaveSettings?.emailNotification ?? true,
    },
  });

  res.status(201).json({
    success: true,
    message: "Admin settings added successfully.",
    adminSettings: formatAdminSettings(adminSettings),
  });
});

export const getAllAdminSettings = asyncHandler(async (req, res) => {
  const adminSettingsList = await adminSettingsRepository.findAll();

  if (adminSettingsList.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "No admin settings found.",
      adminSettings: [],
    });
  }

  res.status(200).json({
    success: true,
    count: adminSettingsList.length,
    adminSettings: adminSettingsList.map(formatAdminSettings),
  });
});

export const updateAdminSettingsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organization, leaveSettings } = req.body;

  const existingSettings = await adminSettingsRepository.findById(id);
  if (!existingSettings) {
    return res.status(404).json({
      success: false,
      message: "Admin settings not found.",
    });
  }

  if (
    organization?.organizationName &&
    organization.organizationName.trim().toLowerCase() !==
      existingSettings.organization.organizationName.toLowerCase()
  ) {
    const duplicateSettings = await adminSettingsRepository.findByOrganizationName(
      organization.organizationName,
    );
    if (duplicateSettings && duplicateSettings._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: "Admin settings for this organization already exist.",
      });
    }
  }

  const updateData = buildUpdateData(organization, leaveSettings);
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });
  }

  const updatedAdminSettings = await adminSettingsRepository.updateById(
    id,
    updateData,
  );

  res.status(200).json({
    success: true,
    message: "Admin settings updated successfully.",
    adminSettings: formatAdminSettings(updatedAdminSettings),
  });
});

export const deleteAdminSettingsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingSettings = await adminSettingsRepository.findById(id);
  if (!existingSettings) {
    return res.status(404).json({
      success: false,
      message: "Admin settings not found.",
    });
  }

  await adminSettingsRepository.deleteById(id);

  res.status(200).json({
    success: true,
    message: "Admin settings deleted successfully.",
  });
});
