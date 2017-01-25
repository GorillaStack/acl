
"use strict";

function GenericRole(roleId) {
  this.roleId = String(roleId);
}

GenericRole.prototype.getRoleId = function() {
  return this.roleId;
}

exports = module.exports = GenericRole;
