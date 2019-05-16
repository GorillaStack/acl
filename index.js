
"use strict";

function isUndefined(obj) {
  return obj === void 0;
};

function get(obj, path, defaultValue) {
  if (!obj) {
    return defaultValue;
  }

  var value = obj;
  var components = path.split(/\./);

  while (components.length) {
    var component = components.shift();
    if (!isUndefined(value[component])) {
      value = value[component];
    }
    else {
      return defaultValue;
    }
  }

  return value;
}

function set(obj, path, value) {
  var components = path.split(/\./);

  for (var i = 0; i < components.length - 1; i++) {
    var component = components[i];

    if (!obj[component]) {
      obj[component] = {};
    }

    obj = obj[component];
  }

  obj[components[components.length - 1]] = value;
}

function find(list, predicate) {
  // 1. Let O be ? ToObject(list value).
  if (list === null || typeof list === 'undefined') {
    throw new TypeError('"list" is null or not defined');
  }

  var o = Object(list);

  // 2. Let len be ? ToLength(? Get(O, "length")).
  var len = o.length >>> 0;

  // 3. If IsCallable(predicate) is false, throw a TypeError exception.
  if (typeof predicate !== 'function') {
    throw new TypeError('predicate must be a function');
  }

  // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
  var thisArg = arguments[2];

  // 5. Let k be 0.
  var k = 0;

  // 6. Repeat, while k < len
  while (k < len) {
    // a. Let Pk be ! ToString(k).
    // b. Let kValue be ? Get(O, Pk).
    // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
    // d. If testResult is true, return kValue.
    var kValue = o[k];
    if (predicate.call(thisArg, kValue, k, o)) {
      return kValue;
    }
    // e. Increase k by 1.
    k++;
  }

  // 7. Return undefined.
  return undefined;
}

function partition(collection, predicate) {
  var matches = [], fails = [];
  var i;
  for (i in collection) {
    var item = collection[i];
    if (predicate(item)) {
      matches.push(item);
    } else {
      fails.push(item);
    }
  }
  return [matches, fails];
}

function itemNameMatching(name) {
  return function(item) {
    var existingName = Prop.get(item, 'name');
    return existingName === name;
  };
}

var Prop = {
  set: set,
  get: get
};

function GenericResource(resourceId) {
  this.resourceId = resourceId;
}

GenericResource.prototype.getResourceId = function() {
  return this.resourceId;
};

function GenericRole(roleId) {
  this.roleId = String(roleId);
}

GenericRole.prototype.getRoleId = function() {
  return this.roleId;
};

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

function Acl(permissions) {
  this.roleRegistry = new RoleRegistry();
  this.resources = {};
  this.isAllowedRole = null;
  this.isAllowedResource = null;
  this.isAllowedPrivilege = null;
  this.rules = {
    allResources: {
      allRoles: {
        allPrivileges: {
          type: Acl.prototype.TYPE_DENY,
          assert: null
        },
        byPrivilegeId: {}
      },
      byRoleId: {}
    },
    byResourceId: {}
  };

  if (permissions) {
    this.load(permissions);
  }
}

Acl.prototype.TYPE_ALLOW = 'ALLOW';
Acl.prototype.TYPE_DENY  = 'DENY';
Acl.prototype.OP_ADD     = 'ADD';
Acl.prototype.OP_REMOVE  = 'REMOVE';

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
 * @param  {GenericRole|string} role
 * @param  {GenericRole|string|array} parents
 * @throws {Error}
 * @return {Acl}
 */
Acl.prototype.addRole = function(role, parents) {
  if (typeof role === 'string' || role instanceof String) {
    role = new GenericRole(role);
  }
  else
  if (! role instanceof GenericRole) {
    throw new Error("addRole expects the 'role' parameter to be of type string or GenericRole");
  }

  this.roleRegistry.add(role, parents);

  return this;
};

/**
 * Returns the identified Role
 *
 * The role parameter can either be a GenericRole or Role identifier.
 *
 * @param {GenericRole|string} role
 * @return {GenericRole}
 */
Acl.prototype.getRole = function(role) {
  return this.roleRegistry.get(role);
};

/**
 * Returns true if and only if the Role exists in the registry
 *
 * The role parameter can either be a GenericRole or a Role identifier.
 *
 * @param {GenericRole|string} role
 * @return {bool}
 */
Acl.prototype.hasRole = function(role) {
  return this.roleRegistry.has(role);
};

/**
 * Returns true if and only if role inherits from inherit
 *
 * Both parameters may be either a GenericRole or a Role identifier. If
 * onlyParents is true, then role must inherit directly from
 * inherit in order to return true. By default, this method looks
 * through the entire inheritance DAG to determine whether role
 * inherits from inherit through its ancestor Roles.
 *
 * @param {GenericRole|string} role
 * @param {GeenricRole|string} inherit
 * @param {bool} onlyParents
 * @return {bool}
 */
Acl.prototype.inheritsRole = function(role, inherit, onlyParents) {
  return this.roleRegistry.inherits(role, inherit, onlyParents);
};

/**
 * Removes the Role from the registry
 *
 * The role parameter can either be a GenericRole or a Role identifier.
 *
 * @param {GenericRole|string} role
 * @throws {Error}
 * @return {Acl}
 */
Acl.prototype.removeRole = function(role) {
  this.roleRegistry.remove(role);

  var roleId;

  if (role instanceof GenericRole) {
    roleId = role.getRoleId();
  }
  else {
    roleId = role;
  }

  for (var roleIdCurrent in this.rules.allResources.byRoleId) {
    if (roleId === roleIdCurrent) {
      delete this.rules.allResources.byRoleId[roleIdCurrent];
    }
  }

  for (var resourceIdCurrent in this.rules.byResourceId) {
    var visitor = this.rules.byResourceId[resourceIdCurrent];

    if ('byRoleId' in visitor) {
      for (var roleIdCurrent in visitor.byRoleId) {
        if (roleId === roleIdCurrent) {
          delete this.rules.byResourceId[resourceIdCurrent].byRoleId[roleIdCurrent];
        }
      }
    }
  }

  return this;
};

/**
 * Removes all Roles from the registry
 *
 * @return {Acl}
 */
Acl.prototype.removeRoleAll = function() {
  this.roleRegistry.removeAll();

  for (var roleIdCurrent in this.rules.allResources.byRoleId) {
    delete this.rules.allResources.byRoleId[roleIdCurrent];
  }

  for (var resourceIdCurrent in this.rules.byResourceId) {
    var visitor = this.rules.byResourceId[resourceIdCurrent];
    for (var roleIdCurrent in visitor['byRoleId']) {
      delete this.rules.byResourceId[resourceIdCurrent].byRoleId[roleIdCurrent]
    }
  }

  return this;
};

/**
 * Adds a Resource having an identifier unique to the ACL
 *
 * The parent parameter may be a reference to, or the string identifier for,
 * the existing Resource from which the newly added Resource will inherit.
 *
 * @param {GenericResource|string} resource
 * @param {GenericResource|string} parent
 * @throws {Error}
 * @return {Acl}
 */
Acl.prototype.addResource = function(resource, parent) {
  parent = parent || null;

  if (typeof resource === 'string' || resource instanceof String) {
    resource = new GenericResource(resource);
  }
  else {
    if (!resource instanceof GenericResource) {
      throw new Error("Acl::addResource() expects 'resource' to be of string or type GenericResource");
    }
  }

  if (this.hasResource(resource)) {
    throw new Error("Resource id '"+resource.getResourceId()+"' already exists in the ACL");
  }

  var resourceId = resource.getResourceId();

  if (parent) {
    parent = this.getResource(parent);

    this.resources[parent.getResourceId()]['children'][resourceId] = resource;
  }

  this.resources[resourceId] = {
    instance: resource,
      parent: parent,
    children: {}
  };

  return this;
};

/**
 * Returns the identified Resource
 *
 * The resource parameter can either be a GenericResource or a Resource identifier.
 *
 * @param {GenericResource|string} resource
 * @throws {Error}
 * @return {GenericResource}
 */
Acl.prototype.getResource = function(resource) {
  var resourceId;

  if (resource instanceof GenericResource) {
    resourceId = resource.getResourceId();
  }
  else {
    resourceId = resource;
  }

  if (!this.hasResource(resource)) {
    throw new Error("Resource '"+resourceId+"' not found");
  }

  return this.resources[resourceId]['instance'];
};

/**
 * Returns true if and only if the Resource exists in the ACL
 *
 * The resource parameter can either be a GenericResource or a Resource identifier.
 *
 * @param {GenericResource|string} resource
 * @return {bool}
 */
Acl.prototype.hasResource = function(resource) {
  var resourceId;

  if (resource instanceof GenericResource) {
    resourceId = resource.getResourceId();
  }
  else {
    resourceId = resource;
  }

  return (resourceId in this.resources);
};

/**
 * Returns true if and only if resource inherits from inherit
 *
 * Both parameters may be either a Resource or a Resource identifier. If
 * onlyParent is true, then resource must inherit directly from
 * inherit in order to return true. By default, this method looks
 * through the entire inheritance tree to determine whether resource
 * inherits from inherit through its ancestor Resources.
 *
 * @param {GenericResource|string} resource
 * @param {GenericResource|string} inherit
 * @param {bool} onlyParent
 * @throws {Error}
 * @return {bool}
 */
Acl.prototype.inheritsResource = function(resource, inherit, onlyParent) {
  var resourceId = this.getResource(resource).getResourceId();
  var inheritId = this.getResource(inherit).getResourceId();

  if (this.resources[resourceId]['parent']) {
    var parentId = this.resources[resourceId]['parent'].getResourceId();

    if (inheritId === parentId) {
      return true;
    }
    else
    if(onlyParent) {
      return false;
    }

    while (this.resources[parentId]['parent']) {
      parentId = this.resources[parentId]['parent'].getResourceId();
      if (inheritId === parentId) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Removes a Resource and all of its children
 *
 * The resource parameter can either be a Resource or a Resource identifier.
 *
 * @param {GenericResource|string} resource
 * @throws {Error}
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.removeResource = function(resource) {
  var resourceId = this.getResource(resource).getResourceId();

  var resourcesRemoved = [resourceId];

  var resourceParent = this.resources[resourceId]['parent'];
  if (resourceParent) {
    delete this.resources[resourceParent.getResourceId()]['children'][resourceId];
  }

  for (var childId in this.resources[resourceId]['children']) {
    this.removeResource(childId);
    resourcesRemoved.push(childId);
  }

  for (var i in resourcesRemoved) {
    var resourcesRemovedId = resourcesRemoved[i];

    for (var resourceIdCurrent in this.rules['byResourceId']) {
      if (resourceIdRemoved === resourceIdCurrent) {
        delete this.rules['byResourceId'][resourceIdCurrent];
      }
    }
  }

  delete this.resources[resourceId];

  return this;
};

/**
 * Removes all Resources
 *
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.removeResourceAll = function() {
  for (var resourceId in this.resources) {
    for (var resourceIdCurrent in this.rules['byResourceId']) {
      if (resourceId === resourceIdCurrent) {
        delete this.rules['byResourceId'][resourceIdCurrent];
      }
    }
  }

  this.resources = {};

  return this;
};

/**
 * Returns all child resources from the given resource.
 *
 * @param {GenericResource|string} resource
 * @return {GenericResource}
 */
Acl.prototype.getChildResources = function(resource) {
  var resources = {};

  if (typeof resource === 'string' || resource instanceof String) {
    resource = this.getResource(resource);
  }

  var children = this.resources[resource.getResourceId()]['children'];

  for (var childId in children) {
    resources[childId] = this.getResource(childId);
    Object.assign(resources, this.getChildResources(childId));
  }

  return resources;
};

/**
 * Adds an "allow" rule to the ACL
 *
 * @param {GenericRole|string|array} roles
 * @param {GenericResource|string|array} resources
 * @param {string|array} privileges
 * @param {Assertion|null} assert
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.allow = function(roles, resources, privileges, assert) {
  return this.setRule(Acl.prototype.OP_ADD, Acl.prototype.TYPE_ALLOW, roles, resources, privileges, assert);
};

/**
 * Adds a "deny" rule to the ACL
 *
 * @param {GenericRole|string|array} roles
 * @param {GenericResource|string|array} resources
 * @param {string|array} privileges
 * @param {Assertion|null} assert
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.deny = function(roles, resources, privileges, assert) {
  return this.setRule(Acl.prototype.OP_ADD, Acl.prototype.TYPE_DENY, roles, resources, privileges, assert);
};

/**
 * Removes "allow" permissions from the ACL
 *
 * @param {GenericRole|string|array} roles
 * @param {GenericResource|string|array} resources
 * @param {string|array} privileges
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.removeAllow = function(roles, resources, privileges) {
  return this.setRule(Acl.prototype.OP_REMOVE, Acl.prototype.TYPE_ALLOW, roles, resources, privileges);
};

/**
 * Removes "deny" restrictions from the ACL
 *
 * @param {GenericRole|string|array} roles
 * @param {GenericResource|string|array} resources
 * @param {string|array} privileges
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.removeDeny = function(roles, resources, privileges) {
  return this.setRule(Acl.prototype.OP_REMOVE, Acl.prototype.TYPE_DENY, roles, resources, privileges);
};

/**
 * Performs operations on ACL rules
 *
 * The operation parameter may be either OP_ADD or OP_REMOVE, depending on whether the
 * user wants to add or remove a rule, respectively:
 *
 * OP_ADD specifics:
 *
 *      A rule is added that would allow one or more Roles access to [certain privileges
 *      upon] the specified Resource(s).
 *
 * OP_REMOVE specifics:
 *
 *      The rule is removed only in the context of the given Roles, Resources, and privileges.
 *      Existing rules to which the remove operation does not apply would remain in the
 *      ACL.
 *
 * The type parameter may be either TYPE_ALLOW or TYPE_DENY, depending on whether the
 * rule is intended to allow or deny permission, respectively.
 *
 * The roles and resources parameters may be references to, or the string identifiers for,
 * existing Resources/Roles, or they may be passed as arrays of these - mixing string identifiers
 * and objects is ok - to indicate the Resources and Roles to which the rule applies. If either
 * roles or resources is null, then the rule applies to all Roles or all Resources, respectively.
 * Both may be null in order to work with the default rule of the ACL.
 *
 * The privileges parameter may be used to further specify that the rule applies only
 * to certain privileges upon the Resource(s) in question. This may be specified to be a single
 * privilege with a string, and multiple privileges may be specified as an array of strings.
 *
 * If assert is provided, then its assert() method must return true in order for
 * the rule to apply. If assert is provided with roles, resources, and privileges all
 * equal to null, then a rule having a type of:
 *
 *      TYPE_ALLOW will imply a type of TYPE_DENY, and
 *
 *      TYPE_DENY will imply a type of TYPE_ALLOW
 *
 * when the rule's assertion fails. This is because the ACL needs to provide expected
 * behavior when an assertion upon the default ACL rule fails.
 *
 * @param {string} operation
 * @param {string} type
 * @param {GenericRole|string|array} roles
 * @param {GenericResource|string|array} resources
 * @param {string|array} privileges
 * @param {Assertion} assert
 * @throws {Error}
 * @return {Acl} Provides a fluent interface
 */
Acl.prototype.setRule = function(operation, type, roles, resources, privileges, assert) {
  roles      = roles      || null;
  resources  = resources  || null;
  privileges = privileges || null;
  assert     = assert     || null;

  if (type !== Acl.prototype.TYPE_ALLOW && type !== Acl.prototype.TYPE_DENY) {
    throw Error("Unsupported rule type; must be either '"+Acl.prototype.TYPE_ALLOW+"' or '"+Acl.prototype.TYPE_DENY+"'");
  }

  if (!(typeof roles === 'array' || roles instanceof Array)) {
    roles = [roles];
  }
  else
  if( roles.length === 0 ) {
    roles = [null];
  }

  var rolesTemp = roles;

  roles = [];
  for (var i in rolesTemp) {
    var role = rolesTemp[i];

    if (role) {
      roles.push(this.roleRegistry.get(role));
    }
    else {
      roles.push(null);
    }
  }

  // ensure that all specified Resources exist; normalize input to array of Resource objects or null
  if (!(typeof resources === 'array' || resources instanceof Array)) {
    if (!resources && Object.keys(this.resources).length > 0) {
      resources = Object.keys(this.resources);

      // Passing a null resource; make sure "global" permission is also set!
      if (resources.indexOf(null) < 0) {
        resources.unshift(null);
      }
    }
    else {
      resources = [resources];
    }
  }
  else
  if (resources.length === 0) {
    resources = [null];
  }

  var resourcesTemp = resources;

  resources = [];
  for (var i in resourcesTemp) {
    var resource = resourcesTemp[i];

    if (resource) {
      var resourceObj = this.getResource(resource);
      var resourceId = resourceObj.getResourceId();
      var children = this.getChildResources(resourceObj);
      if (Object.keys(children).length > 0 ) {
        for (var q in children) {
          resources.push(children[q]);
        }
      }
      //resources[resourceId] = resourceObj;
      resources.push(resourceObj);
    }
    else {
      resources.push(null);
    }
  }

  // normalize privileges to array
  if (!privileges) {
    privileges = [];
  }
  else
  if (!(typeof privileges === 'array' || privileges instanceof Array)) {
    privileges = [privileges];
  }

  switch(operation) {
    // add to the rules
    case Acl.prototype.OP_ADD:
      for (var i in resources) {
        var resource = resources[i];
        for (var j in roles) {
          var role = roles[j];
          var rules = this._getRules(resource, role, true);
          if (privileges.length === 0) {
            Prop.set(rules, 'allPrivileges.type', type);
            Prop.set(rules, 'allPrivileges.assert', assert);
            if (Prop.get(rules, 'byPrivilegeId')) {
              Prop.set(rules, 'byPrivilegeId', {});
            }
          }
          else {
            for (var q in privileges) {
              var privilege = privileges[q];
              Prop.set(rules, 'byPrivilegeId.'+privilege+'.type', type);
              Prop.set(rules, 'byPrivilegeId.'+privilege+'.assert', assert);
            }
          }
        }
      }
      break;

    // remove from the rules
    case Acl.prototype.OP_REMOVE:
      for (var i in resources) {
        var resource = resources[i];

        for (var j in roles) {
          var role = roles[j];

          var rules = this._getRules(resource, role);

          if (rules === null) {
            continue;
          }

          if (privileges.length === 0) {
            if (!resource && !role) {
              if (type === Prop.get(rules, 'allPrivileges.type')) {
                rules = {
                  allPrivileges: {
                    type: Acl.prototype.TYPE_DENY,
                    assert: null
                  },
                  byPrivilegeId: {}
                };
              }
              continue;
            }
            if (Prop.get(rules, 'allPrivileges.type') && type === Prop.get(rules, 'allPrivileges.type')) {
              delete rules.allPrivileges;
            }
          }
          else {
            for (var q in privileges) {
              var privilege = privileges[q];
              var rule = Prop.get(rules, 'byPrivilegeId.'+privilege);
              var ruleType = Prop.get(rule, 'type')
              if (rule && type === ruleType) {
                delete rules.byPrivilegeId[privilege];
              }
            }
          }
        }
      }
      break;

    default:
      throw new Error("Unsupported operation; must either be '"+Acl.prototype.OP_ADD+"' or '"+Acl.prototype.OP_REMOVE+"'");
  }

  return this;
};

/**
 * Returns true if and only if the Role has access to the Resource
 *
 * The role and resource parameters may be references to, or the string identifiers for,
 * an existing Resource and Role combination.
 *
 * If either role or resource is null, then the query applies to all Roles or all Resources,
 * respectively. Both may be null to query whether the ACL has a "blacklist" rule
 * (allow everything to all). By default, Zend\Permissions\Acl creates a "whitelist" rule (deny
 * everything to all), and this method would return false unless this default has
 * been overridden (i.e., by executing acl.allow()).
 *
 * If a privilege is not provided, then this method returns false if and only if the
 * Role is denied access to at least one privilege upon the Resource. In other words, this
 * method returns true if and only if the Role is allowed all privileges on the Resource.
 *
 * This method checks Role inheritance using a depth-first traversal of the Role registry.
 * The highest priority parent (i.e., the parent most recently added) is checked first,
 * and its respective parents are checked similarly before the lower-priority parents of
 * the Role are checked.
 *
 * @param {GenericRole|string} role
 * @param {GenericResource|string} resource
 * @param {string} privilege
 * @return {bool}
 */
Acl.prototype.isAllowed = function(role, resource, privilege) {
  role      = role      || null;
  resource  = resource  || null;
  privilege = privilege || null;

  // reset role & resource to null
  this.isAllowedRole = null;
  this.isAllowedResource = null;
  this.isAllowedPrivilege = null;

  if (role !== null) {
    role = this.roleRegistry.get(role);
  }

  this.isAllowedRole = role;

  if (resource != null) {
    resource = this.getResource(resource);
  }

  this.isAllowedResource = resource;

  if (!privilege) {
    // query on all privileges
    do {
      // depth-first search on role if it is not 'allRoles' pseudo-parent
      var result = this._roleDFSAllPrivileges(role, resource, privilege);

      if (role !== null && result !== null) {
        return result;
      }

      // look for rule on 'allRoles' pseudo-parent
      var rules = this._getRules(resource, null);

      if (rules) {
        var byPrivilegeIds = Prop.get(rules, 'byPrivilegeId', {});

        for (var p in byPrivilegeIds) {
          var rule = byPrivilegeIds[p];

          var ruleTypeOnePrivilege = this._getRuleType(resource, null, privilege);

          if (Acl.prototype.TYPE_DENY === ruleTypeOnePrivilege) {
            return false;
          }
        }

        var ruleTypeAllPrivileges = this._getRuleType(resource, null, null);

        if (ruleTypeAllPrivileges) {
          return Acl.prototype.TYPE_ALLOW === ruleTypeAllPrivileges;
        }
      }

      // try next Resource
      resource = this.resources[resource.getResourceId()]['parent'];
    }
    while(resource);
  }
  else {
    this.isAllowedPrivilege = privilege;

    do {
      // depth-first search on role if it is not 'allRoles' pseudo-parent
      var result = this._roleDFSOnePrivilege(role, resource, privilege);

      if (role !== null && result !== null) {
        return result;
      }

      // look for rule on 'allRoles' pseudo-parent
      var ruleType = this._getRuleType(resource, null, privilege);

      if (ruleType !== null) {
        return Acl.prototype.TYPE_ALLOW == ruleType;
      }
      else {
        var ruleTypeAllPrivileges = this._getRuleType(resource, null, null);

        if (ruleTypeAllPrivileges !== null) {
          result = (Acl.prototype.TYPE_ALLOW === ruleTypeAllPrivileges);

          if (result || resource === null) {
            return result;
          }
        }
      }

      // try next Resource
      resource = this.resources[resource.getResourceId()]['parent'];
    }
    while(resource);
  }

  return false;
};

/**
 * Performs a depth-first search of the Role DAG, starting at role, in order to find a rule
 * allowing/denying role access to all privileges upon resource
 *
 * This method returns true if a rule is found and allows access. If a rule exists and denies access,
 * then this method returns false. If no applicable rule is found, then this method returns null.
 *
 * @param {GenericRole} role
 * @param {GenericResource} resource
 * @return {bool|null}
 */
Acl.prototype._roleDFSAllPrivileges = function(role, resource) {
  resource = resource || null;

  var dfs = {
    visited: {},
      stack: []
  };

  var result = this._roleDFSVisitAllPrivileges(role, resource, dfs);

  if (result !== null) {
    return result;
  }

  var role;
  while ((role = dfs.stack.pop())) {
    var roleId = Prop.get(dfs, 'visited.'+role.getRoleId());
    if (!roleId) {
      result = this._roleDFSVisitAllPrivileges(role, resource, dfs);

      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Visits an role in order to look for a rule allowing/denying role access to all privileges upon resource
 *
 * This method returns true if a rule is found and allows access. If a rule exists and denies access,
 * then this method returns false. If no applicable rule is found, then this method returns null.
 *
 * This method is used by the internal depth-first search algorithm and may modify the DFS data structure.
 *
 * @param {GenericRole} role
 * @param {GenericResource} resource
 * @param {Object} dfs
 * @return {bool|null}
 * @throws {Error}
 */
Acl.prototype._roleDFSVisitAllPrivileges = function(role, resource, dfs) {
  resource = resource || null;
  dfs      = dfs      || null;

  if (!dfs) {
    throw new Error("dfs parameter may not be null");
  }

  var rules = this._getRules(resource, role);

  if (rules !== null) {
    for (var privilege in rules.byPrivilegeId ) {
      var ruleTypeOnePrivilege = this._getRuleType(resource, role, privilege);
      if (Acl.prototype.TYPE_DENY === ruleTypeOnePrivilege) {
        return false;
      }
    }

    var ruleTypeAllPrivileges = this._getRuleType(resource, role, null);

    if (ruleTypeAllPrivileges !== null) {
      return Acl.prototype.TYPE_ALLOW === ruleTypeAllPrivileges;
    }
  }

  dfs.visited[role.getRoleId()] = true;

  var parents = this.roleRegistry.getParents(role);
  for (var roleParent in parents ) {
    dfs.stack.push(parents[roleParent]);
  }

  return null;
};

/**
 * Performs a depth-first search of the Role DAG, starting at role, in order to find a rule
 * allowing/denying role access to a privilege upon resource
 *
 * This method returns true if a rule is found and allows access. If a rule exists and denies access,
 * then this method returns false. If no applicable rule is found, then this method returns null.
 *
 * @param {GenericRole} role
 * @param {GenericResource} resource
 * @param {String} privilege
 * @return {bool|null}
 * @throws {Error}
 */
Acl.prototype._roleDFSOnePrivilege = function(role, resource, privilege) {
  resource  = resource  || null;
  privilege = privilege || null;

  if (!privilege) {
    throw new Error("privilege parameter may not be null");
  }

  var dfs = {
    visited: {},
      stack: []
  };

  var result = this._roleDFSVisitOnePrivilege(role, resource, privilege, dfs);

  if (result !== null) {
    return result;
  }

  var role;
  while (role = dfs.stack.pop()) {
    var roleId = Prop.get(dfs, 'visited.'+role.getRoleId());
    if (!roleId) {
      result = this._roleDFSVisitOnePrivilege(role, resource, privilege, dfs);

      if (result !== null) {
        return result;
      }
    }
  }

  return null;
};

/**
 * Visits an role in order to look for a rule allowing/denying role access to a privilege upon resource
 *
 * This method returns true if a rule is found and allows access. If a rule exists and denies access,
 * then this method returns false. If no applicable rule is found, then this method returns null.
 *
 * This method is used by the internal depth-first search algorithm and may modify the DFS data structure.
 *
 * @param {GenericRole} role
 * @param {GenericResource} resource
 * @param {String} privilege
 * @param {Object} dfs
 * @return {bool|null}
 * @throws {Error}
 */
Acl.prototype._roleDFSVisitOnePrivilege = function(role, resource, privilege, dfs) {
  resource  = resource  || null;
  privilege = privilege || null
  dfs       = dfs       || null;

  if (!privilege) {
    throw new Error("privilege parameter may not be null");
  }

  if (!dfs) {
    throw new Error("dfs parameter may not be null");
  }

  var ruleTypeOnePrivilege  = this._getRuleType(resource, role, privilege);
  var ruleTypeAllPrivileges = this._getRuleType(resource, role, null);

  if (ruleTypeOnePrivilege !== null) {
    return Acl.prototype.TYPE_ALLOW === ruleTypeOnePrivilege;
  }
  else
  if (ruleTypeAllPrivileges !== null) {
    return Acl.prototype.TYPE_ALLOW === ruleTypeAllPrivileges;
  }

  dfs.visited[role.getRoleId()] = true;

  var parents = this.roleRegistry.getParents(role);
  for (var roleParent in parents) {
    dfs.stack.push(parents[roleParent]);
  }

  return null;
};

/**
 * Returns the rule type associated with the specified Resource, Role, and privilege
 * combination.
 *
 * If a rule does not exist or its attached assertion fails, which means that
 * the rule is not applicable, then this method returns null. Otherwise, the
 * rule type applies and is returned as either TYPE_ALLOW or TYPE_DENY.
 *
 * If resource or role is null, then this means that the rule must apply to
 * all Resources or Roles, respectively.
 *
 * If privilege is null, then the rule must apply to all privileges.
 *
 * If all three parameters are null, then the default ACL rule type is returned,
 * based on whether its assertion method passes.
 *
 * @param {GenericResource|null} resource
 * @param {GenericRole|null} role
 * @param {String|null} privilege
 * @return {String|null}
 */
Acl.prototype._getRuleType = function(resource, role, privilege) {
  var rules = this._getRules(resource, role);

  if (rules === null) {
    return null;
  }

  var rule;

  if (!privilege) {
    rule = Prop.get(rules, 'allPrivileges');
  }
  else {
    rule = Prop.get(rules, 'byPrivilegeId.'+privilege);
  }

  if (!rule) {
    return null;
  }

  var ruleType = Prop.get(rule, 'type');
  var ruleAssert = Prop.get(rule, 'assert');
  var assertionValue = null;

  if (ruleAssert) {
    throw new Error("ACL Assertions not yet implemented");
  }

  if (!ruleAssert || assertionValue) {
    return ruleType;
  }
  else
  if (!resource || !role || !privilege) {
    return null;
  }
  else
  if (Acl.prototype.TYPE_ALLOW === ruleType) {
    return Acl.prototype.TYPE_DENY;
  }

  return Acl.prototype.TYPE_ALLOW;
};

/**
 * Returns the rules associated with a Resource and a Role, or null if no such rules exist
 *
 * If either resource or role is null, this means that the rules returned are for all Resources or all Roles,
 * respectively. Both can be null to return the default rule set for all Resources and all Roles.
 *
 * If the create parameter is true, then a rule set is first created and then returned to the caller.
 *
 * @param {GenericResource} resource
 * @param {GenericRole} role
 * @param {bool} create
 * @return {Object|null}
 */
Acl.prototype._getRules = function(resource, role, create) {
  resource = resource || null;
  role     = role     || null;
  create   = create   || false;

  var visitor;

  if (resource === null) {
    visitor = this.rules.allResources;
  }
  else {
    var resourceId = resource.getResourceId();
    if (!(resourceId in this.rules.byResourceId)) {
      if (!create) {
        return null;
      }

      this.rules.byResourceId[resourceId] = {};
    }

    visitor = this.rules.byResourceId[resourceId];
  }

  if (role === null) {
    if (!('allRoles' in visitor)) {
      if (!create) {
        return null;
      }

      Prop.set(visitor, 'allRoles.byPrivilegeId', {});
    }

    return visitor.allRoles;
  }

  var roleId = role.getRoleId();

  if (!visitor.hasOwnProperty('byRoleId') || !visitor.byRoleId.hasOwnProperty(roleId)) {
    if (!create) {
      return null;
    }

    Prop.set(visitor, 'byRoleId.'+roleId+'.byPrivilegeId', {});
  }

  return Prop.get(visitor, 'byRoleId.'+roleId, null);
};

/**
 * @return array of registered roles
 */
Acl.prototype.getRoles = function() {
  return Object.keys(this.roleRegistry.getRoles());
};

/**
 * @return array of registered resources
 */
Acl.prototype.getResources = function() {
  return Object.keys(this.resources);
};

/**
 * @private
 *
 * Checks the given list of names, that
 * all exist in the list of resources/roles
 *
 * @param {array<object>} list list of roles / resources
 * @param {array<string>} names names to check
 *
 * @returns {boolean} true when all the names exist
 */
Acl._isResolved = function(list, names) {
  if (!names) {
    return true;
  }
  names = typeof names === 'string' ? [names] : names;

  var i, j;
  for (i in names) {
    var name = names[i];
    var exists = find(list, itemNameMatching(name));

    if (!exists) {
      return false;
    }
  }
  return true;
}

/**
 * @private
 *
 * Checks that the given list of parent names all exist in
 * the allNames list. Throws an exception if this is not the
 * case.
 */
Acl._checkAllExists = function(allNames, parents) {
  parents = typeof parents === 'string' ? [parents] : parents;
  parents.forEach(function(parent) {
    if (allNames.indexOf(parent) < 0) {
      throw new Error("parent '" + parent + "' does not exist");
    }
  });
}

/**
 * @private
 *
 * This function orders a list of roles or resources based
 * on their parent structures, checking for cycles and
 * non-existent parent references.
 */
Acl._orderAndCycleCheck = function(list) {
  // check for non-existent parents
  var allNames = list.map(function (item) { return item.name; });

  var unresolved = [].concat(list);
  var resolved = [];

  var firstTime = true;

  while (unresolved.length > 0) {
    var results = partition(unresolved, function(item) {
      var parents = Prop.get(item, 'parent');
      if (firstTime && parents) {
        Acl._checkAllExists(allNames, parents);
      }
      return Acl._isResolved(resolved, parents);
    });
    firstTime = false;

    var newResolved = results[0];

    // when nothing is resolved, it could be a cycle
    if (newResolved.length === 0) {
      throw new Error('cycle detected');
    }

    resolved = resolved.concat(newResolved);
    unresolved = results[1];
  }
  return resolved;
}

/**
 * Loads permissions into the ACL.
 */
Acl.prototype.load = function(permissions) {
  permissions = permissions || null;

  if (!permissions) {
    throw new Error("Permissions must be set.");
  }

  var i;

  var roles = Acl._orderAndCycleCheck(permissions.roles);
  var resources = Acl._orderAndCycleCheck(permissions.resources);

  for (i in roles) {
    var role = roles[i];

    var name   = Prop.get(role, 'name');
    var parent = Prop.get(role, 'parent');

    this.addRole(name, parent);
  }

  for (i in resources) {
    var resource = resources[i];

    var name   = Prop.get(resource, 'name');
    var parent = Prop.get(resource, 'parent');

    this.addResource(name, parent);
  }

  for (i in permissions.rules) {
    var rule = permissions.rules[i];

    var access     = Prop.get(rule, 'access', undefined);
    var role       = Prop.get(rule, 'role', undefined);
    var privileges = Prop.get(rule, 'privileges', undefined);
    var resources  = Prop.get(rule, 'resources', undefined);

    if (access === undefined) {
      throw new Error("Access cannot be undefined.");
    }

    if (role === undefined) {
      throw new Error("Role cannot be undefined.");
    }

    if (privileges === undefined) {
      throw new Error("Privileges cannot be undefined");
    }

    if (resources === undefined) {
      throw new Error("Resources cannot be undefined");
    }

    switch (access) {
      case 'allow':
        this.allow(role, resources, privileges);
        break;

      case 'deny':
        this.deny(role, resources, privileges);
        break;

      default:
        throw new Error("Unknown access '"+access+"' found.");
    }
  }
};

(function(){
  var AclClass = (function() {
    return Acl;
  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Acl;
  }
  else {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return Acl;
      });
    }
    else {
      window.Acl = Acl;
    }
  }
})();
