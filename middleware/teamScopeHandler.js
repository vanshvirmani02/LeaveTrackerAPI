export const teamScopeHandler = (req, res, next) => {
  req.leaveRequestScope = "team";
  next();
};
