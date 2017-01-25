
"use strict";

var GenericRole = require('./generic_role.js');

function RoleRegistry() {
  this.roles = {};
}

/**
 * Adds a Role having an identifier unique to the registry
 *
 * The parents parameter may be a reference to, or the string identifier for,
 * a Role existing in the registry, or parents may be passed as an array of
 * these - mixing string identifiers and objects is ok - to indicate the Roles
 * from which the newly added Role will directly inherit.
 *
 * In order to resolve potential ambiguities with conflicting rules inherited
 * from different parents, the most recently added parent takes precedence over
 * parents that were previously added. In other words, the first parent added
 * will have the least priority, and the last parent added will have the
 * highest priority.
 *
 * @param {GenericRole} role
 * @param {GenericRole|string|array} parents
 * @throws {Error}
 * @return {RoleRegistry}
 */
RoleRegistry.prototype.add = function(role, parents) {
  var roleId = role.getRoleId();

  if (this.has(roleId)) {
    throw new Error("'Role id "+roleId+" already exists in the registry'");
  }

  var roleParents = {};

  if (parents) {
    if (typeof parents === 'string' || parents instanceof String) {
      parents = [parents];
    }

    for (var i in parents) {
      var parent = parents[i];

      var roleParentId;

      if (parent instanceof GenericRole) {
        roleParentId = parent.getRoleId();
      }
      else {
        roleParentId = parent;
      }

      var roleParent = this.get(roleParentId);

      roleParents[roleParentId] = roleParent;
      this.roles[roleParentId]['children'][roleId] = role;
    }
  }

  this.roles[roleId] = {
    instance: role,
     parents: roleParents,
    children: {}
  };

  return this;
};

/**
 * Returns the identified Role
 *
 * The role parameter can either be a Role or a Role identifier.
 *
 * @param {GenericRole|string} role
 * @throws {Error}
 * @return {GenericRole}
 */
RoleRegistry.prototype.get = function(role) {
  var roleId;

  if (role instanceof GenericRole) {
    roleId = role.getRoleId();
  }
  else {
    roleId = role;
  }

  if (!this.has(roleId)) {
    throw new Error("Role '"+roleId+"' not found");
  }

  return this.roles[roleId]['instance'];
};

/**
 * Returns true if and only if the Role exists in the registry
 *
 * The role parameter can either be a Role or a Role identifier.
 *
 * @param {GenericRole|string} role
 * @return {bool}
 */
RoleRegistry.prototype.has = function(role) {
  var roleId;

  if (role instanceof GenericRole) {
    roleId = role.getRoleId();
  }
  else {
    roleId = role;
  }

  return (roleId in this.roles);
};

/**
 * Returns an object of an existing Role's parents
 *
 * The object keys are the identifiers of the parent Roles, and the values are
 * the parent Role instances. The parent Roles are ordered in this object by
 * ascending priority. The highest priority parent Role, last in the object,
 * corresponds with the parent Role most recently added.
 *
 * If the Role does not have any parents, then an empty object is returned.
 *
 * @param {GenericRole|string} role
 * @return {Object}
 */
RoleRegistry.prototype.getParents = function(role) {
  var roleId = this.get(role).getRoleId();
  return this.roles[roleId]['parents'];
};

/**
 * Returns an object of an existing Role's children
 *
 * The object keys are the identifiers of the child Roles, and the values are
 * the child Role instances. The child Roles are ordered in this object by
 * ascending priority. The highest priority child Role, last in the object,
 * corresponds with the child Role most recently added.
 *
 * If the Role does not have any children, then an empty object is returned.
 *
 * @param {GenericRole|string} role
 * @return {Object}
 */
RoleRegistry.prototype.getChildren = function(role) {
  var roleId = this.get(role).getRoleId();
  return this.roles[roleId]['children'];
};

/**
 * Returns true if and only if role inherits from inherit
 *
 * Both parameters may be either a Role or a Role identifier. If
 * onlyParents is true, then role must inherit directly from
 * inherit in order to return true. By default, this method looks
 * through the entire inheritance DAG to determine whether role
 * inherits from inherit through its ancestor Roles.
 *
 * @param {GenericRole|string} role
 * @param {GenericRole|string} inherit
 * @param {bool} onlyParents
 * @throws {Error}
 * @return {bool}
 */
RoleRegistry.prototype.inherits = function(role, inherit, onlyParents) {
  var roleId = this.get(role).getRoleId();
  var inheritId = this.get(inherit).getRoleId();

  var inherits = (inheritId in this.roles[roleId]['parents']);

  if (inherits || onlyParents) {
    return inherits;
  }

  for (var parentId in this.roles[roleId]['parents']) {
    if (this.inherits(parentId, inheritId)) {
      return true;
    }
  }

  return false;
};

/**
 * Removes the Role from the registry
 *
 * The role parameter can either be a Role or a role identifier.
 *
 * @param {GenericRole|string} role
 * @throws {Error}
 * @return {RoleRegistry}
 */
RoleRegistry.prototype.remove = function(role) {
  var roleId = this.get(role).getRoleId();

  for (var childId in this.roles[roleId]['children']) {
    delete this.roles[childId]['parents'][roleId];
  }

  for (var parentId in this.roles[roleId]['parents']) {
    delete this.roles[parentId]['children'][roleId];
  }

  delete this.roles[roleId];

  return this;
};

/**
 * Removes all Roles from the registry
 *
 * @return {RoleRegistry}
 */
RoleRegistry.prototype.removeAll = function() {
  this.roles = {};
  return this;
};

/**
 * Get all roles in the registry
 *
 * @return {Object}
 */
RoleRegistry.prototype.getRoles = function() {
  return this.roles;
};

exports = module.exports = RoleRegistry;
