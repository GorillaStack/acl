
var GenericRole = require('../src/generic_role.js');
var RoleRegistry = require('../src/role_registry.js');

describe("RoleRegistry", function() {

  var roleRegistry = null;

  beforeEach(function() {
    roleRegistry = new RoleRegistry();
  });

  describe("has", function() {
    beforeEach(function() {
      roleRegistry.roles = {
        testRole: {
          instance: new GenericRole('testRole'),
           parents: {},
          children: {}
        }
      };
    });

    describe("fails", function() {
      it("when a role Id does not exist", function() {
        var hasRole = roleRegistry.has('unknownRole');
        expect(hasRole).toBe(false);
      });

      it("when a GenericRole does not exists", function() {
        var hasRole = roleRegistry.has(new GenericRole('unknownRole'));
        expect(hasRole).toBe(false);
      });
    });

    describe("succeeds", function() {
      it("when a role Id exists", function() {
        var hasRole = roleRegistry.has('testRole');
        expect(hasRole).toBe(true);
      });

      it('when a GenericRole exists', function() {
        var hasRole = roleRegistry.has(new GenericRole('testRole'));
        expect(hasRole).toBe(true);
      });
    });
  });

  describe("get", function() {
    beforeEach(function() {
      roleRegistry.roles = {
        testRole: {
          instance: new GenericRole('testRole'),
           parents: {},
          children: {}
        }
      };
    });

    describe("fails", function() {
      it("throws Error when roleId does not exist", function() {
        expect(function() {
          roleRegistry.get('unknownRole');
        })
        .toThrowError(Error);
      });

      it("throws Error when GenericRole does not exist", function() {
        expect(function() {
          roleRegistry.get(new GenericRole('unknownRole'));
        })
        .toThrowError(Error);
      })
    });

    describe("succeeds", function() {
      it("when role Id exists", function() {
        var role = roleRegistry.get('testRole');
        expect(role instanceof GenericRole).toBe(true);
        expect(role.getRoleId === 'testRole');        
      });

      it("when GenericRole exists", function() {
        var role = roleRegistry.get(new GenericRole('testRole'));
        expect(role instanceof GenericRole).toBe(true);
        expect(role.getRoleId === 'testRole');
      });
    });
  });

  describe("add", function() {
    describe("fails", function() {
      beforeEach(function() {
        roleRegistry.roles = {
          testRole: {
            instance: new GenericRole('testRole'),
             parents: {},
            children: {}
          }
        };
      });

      it("throws Error when role already exists", function() {
        expect(function() {
          roleRegistry.add(new GenericRole('testRole'));
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when role does not exists", function() {
        var role = roleRegistry.add(new GenericRole('testRole')).get('testRole');
        expect(role instanceof GenericRole).toBe(true);
        expect(role.getRoleId()).toEqual('testRole');
      });

      it("when role has one parent with a role Id that does not exist", function() {
        var role = roleRegistry
          .add(new GenericRole('parentRole'))
          .add(new GenericRole('testRole'), 'parentRole')
          .get('testRole')
        ;
        expect(role instanceof GenericRole).toBe(true);
        expect(role.getRoleId()).toEqual('testRole');
      });

      it("when role has two parents with role Id's that do not exist", function() {
        var role = roleRegistry
          .add(new GenericRole('parentRoleA'))
          .add(new GenericRole('parentRoleB'))
          .add(new GenericRole('testRole'), ['parentRoleA', 'parentRoleB'])
          .get('testRole')
        ;
        expect(role instanceof GenericRole).toBe(true);
        expect(role.getRoleId()).toEqual('testRole');
      });
    });
  });

  describe("getParents", function() {
    describe("fails", function() {
      it("throws Error when role does not exists", function() {
        expect(function() {
          roleRegistry.getParents(new GenericRole('unknownRole'));
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when a role with one parent role has been added", function() {
        roleRegistry
          .add(new GenericRole('parentRole'))
          .add(new GenericRole('testRole'), 'parentRole')
        ;

        var parentRoles = roleRegistry.getParents('testRole');
        expect(parentRoles['parentRole'] instanceof GenericRole).toBe(true);
        expect(parentRoles['parentRole'].getRoleId()).toEqual('parentRole');
      });

      it("when a role with two parent roles has been added", function() {
        roleRegistry
          .add(new GenericRole('parentRoleA'))
          .add(new GenericRole('parentRoleB'))
          .add(new GenericRole('testRole'), ['parentRoleA', 'parentRoleB'])
        ;

        var parentRoles = roleRegistry.getParents('testRole');
        expect(parentRoles['parentRoleA'] instanceof GenericRole).toBe(true);
        expect(parentRoles['parentRoleA'].getRoleId()).toEqual('parentRoleA');
        expect(parentRoles['parentRoleB'] instanceof GenericRole).toBe(true);
        expect(parentRoles['parentRoleB'].getRoleId()).toEqual('parentRoleB');
      });
    });
  });

  describe("getChildren", function() {
    describe("fails", function() {
      it("throws Error when role does not exists", function() {
        expect(function() {
          roleRegistry.getChildren(new GenericRole('unknownRole'));
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when a role is a child of another role", function() {
        roleRegistry
          .add(new GenericRole('parentRoleA'))
          .add(new GenericRole('parentRoleB'))
          .add(new GenericRole('testRole'), ['parentRoleA', 'parentRoleB'])
        ;

        var children;

        children = roleRegistry.getChildren('parentRoleA');
        expect('testRole' in children).toBe(true);
        
        children = roleRegistry.getChildren('parentRoleB');
        expect('testRole' in children).toBe(true);
      });
    });
  });

  describe("inherits", function() {
    describe("fails", function() {
      it("when role A does not inherit from role B", function() {
        roleRegistry
          .add(new GenericRole('testRoleA'))
          .add(new GenericRole('testRoleB'))
        ;

        var inherits = roleRegistry.inherits('testRoleA', 'testRoleB');
        expect(inherits).toBe(false);
      });

      it("when role A is not a direct parent of role C", function() {
        roleRegistry
          .add(new GenericRole('testRoleA'))
          .add(new GenericRole('testRoleB'), 'testRoleA')
          .add(new GenericRole('testRoleC'), 'testRoleB')
        ;

        var inherits = roleRegistry.inherits('testRoleC', 'testRoleA', true);
        expect(inherits).toBe(false);
      });
    });

    describe("succeeds", function() {
      it("when role B does inherit from role A", function() {
        roleRegistry
          .add(new GenericRole('testRoleA'))
          .add(new GenericRole('testRoleB'), 'testRoleA')
        ;

        var inherits = roleRegistry.inherits('testRoleB', 'testRoleA');
        expect(inherits).toBe(true);
      });

      it("when role A is not a direct parent of role C", function() {
        roleRegistry
          .add(new GenericRole('testRoleA'))
          .add(new GenericRole('testRoleB'), 'testRoleA')
          .add(new GenericRole('testRoleC'), 'testRoleB')
        ;

        var inherits = roleRegistry.inherits('testRoleC', 'testRoleA');
        expect(inherits).toBe(true);
      });
    });
  });

  describe("remove", function() {
    describe("fails", function() {
      it("when the role does not exist", function() {
        expect(function() {
          roleRegistry.remove(new GenericRole('testRole'));
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when an existing role is deleted", function() {
        roleRegistry.add(new GenericRole('testRoleA'));
        roleRegistry.remove('testRoleA');

        expect(function() {
          roleRegistry.get('testRole');
        })
        .toThrowError(Error);
      });

      it("when an existing role with a parent role is deleted", function() {
        roleRegistry
          .add(new GenericRole('testRoleA'))
          .add(new GenericRole('testRoleB'), 'testRoleA')
          .add(new GenericRole('testRoleC'), 'testRoleB')
        ;

        var parents;
        var children;

        // First, testRoleB should exist as both a child and a parent.
        children = roleRegistry.getChildren('testRoleA');
        expect('testRoleB' in children).toBe(true);

        parents = roleRegistry.getParents('testRoleC');
        expect('testRoleB' in parents).toBe(true);

        // We now remove testRoleB.
        roleRegistry.remove('testRoleB');
        
        // Now, testRoleB should no longer be either a child nor a parent.
        children = roleRegistry.getChildren('testRoleA');
        expect('testRoleB' in children).toBe(false);

        parents = roleRegistry.getParents('testRoleC');
        expect('testRoleB' in parents).toBe(false);
      });
    });
  });

  describe("removeAll", function() {
    describe("succeeds", function() {
      it("when it is called", function() {
        var roles = roleRegistry.removeAll().getRoles();

        expect(Object.keys(roles).length).toEqual(0);
      });
    });
  });

});
