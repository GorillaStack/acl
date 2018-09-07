
var Acl = require('../index.js');

describe("Acl", function() {

  var acl = null;

  beforeEach(function() {
    acl = new Acl();
  });

  describe("addRole", function() {
    describe("fails", function() {
      it("when the role added is neither a string or a GenericRole", function() {
        // Try adding a general purpose object.
        expect(function() {
          acl.addRole({});
        })
        .toThrowError(Error);

        // Try adding a general purpose array.
        expect(function() {
          acl.addRole([]);
        })
        .toThrowError(Error);
      })
    });

    describe("succeeds", function() {
      it("when the role added is either a string or a GenericRole", function() {
        var role;

        role = acl.addRole('testRoleA').getRole('testRoleA');
        expect(role.getRoleId()).toEqual('testRoleA');
      });
    });
  });

  describe("getRole", function() {
    describe("fails", function() {
      it("when the role does not exist", function() {
        expect(function() {
          acl.getRole('unknownRole')
        })
        .toThrowError(Error);
      })
    });

    describe("succeeds", function() {
      it("when the role does exist", function() {
        var role = acl.addRole('testRole').getRole('testRole');
        expect(role.getRoleId()).toEqual('testRole');
      });
    });
  });

  describe("hasRole", function() {
    describe("fails", function() {
      it("when the role does not exist", function() {
        expect(acl.hasRole('unknownRole')).toBe(false);
      });
    });

    describe("succeeds", function() {
      it("when the role exists", function() {
        expect(acl.addRole("testRole").hasRole('testRole')).toBe(true);
      })
    });
  });

  describe("inherits", function() {
    describe("fails", function() {
      it("when role A does not inherit from role B", function() {
        acl
          .addRole('testRoleA')
          .addRole('testRoleB')
        ;

        var inherits = acl.inheritsRole('testRoleA', 'testRoleB');
        expect(inherits).toBe(false);
      });

      it("when role A is not a direct parent of role C", function() {
        acl
          .addRole('testRoleA')
          .addRole('testRoleB', 'testRoleA')
          .addRole('testRoleC', 'testRoleB')
        ;

        var inherits = acl.inheritsRole('testRoleC', 'testRoleA', true);
        expect(inherits).toBe(false);
      });
    });

    describe("succeeds", function() {
      it("when role B does inherit from role A", function() {
        acl
          .addRole('testRoleA')
          .addRole('testRoleB', 'testRoleA')
        ;

        var inherits = acl.inheritsRole('testRoleB', 'testRoleA');
        expect(inherits).toBe(true);
      });

      it("when role A is not a direct parent of role C", function() {
        acl
          .addRole('testRoleA')
          .addRole('testRoleB', 'testRoleA')
          .addRole('testRoleC', 'testRoleB')
        ;

        var inherits = acl.inheritsRole('testRoleC', 'testRoleA');
        expect(inherits).toBe(true);
      });
    });
  });  

  describe("removeRole", function() {
    describe("fails", function() {
      it("when the role does not exist", function() {
        expect(function() {
          acl.removeRole('unknownRole');
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when the role exists", function() {
        acl
          .addRole('testRole')
          .removeRole('testRole')
        ;

        expect(acl.hasRole('testRole')).toBe(false);
      });
    });
  });

  describe("removeRoleAll", function() {
    describe("succeeds", function() {
      it("when all roles are removed", function() {
        acl
          .addRole('testRoleA')
          .addRole('testRoleB', 'testRoleA')
          .addRole('testRoleC')
        ;

        expect( acl.getRoles().length ).toEqual(3);
        acl.removeRoleAll();
        expect( acl.getRoles().length ).toEqual(0);
      });
    });
  });

  describe("addResource", function() {
    describe("fails", function() {
      it("when the resource is neither string nor GenericResource", function() {
        // Try adding a general purpose object.
        expect(function() {
          acl.addResource({});
        })
        .toThrowError(Error);

        // Try adding a general purpose array.
        expect(function() {
          acl.addResource([]);
        })
        .toThrowError(Error);
      });

      it("when the resource already exists", function() {
        acl
          .addResource('testResource')
        ;

        expect(function() {
          acl.addResource('testResource');
        })
        .toThrowError(Error);
      });

      it("when the parent resource does not exists", function() {
        expect(function() {
          acl.addResource('testResource', 'unknownParentResource');
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when the resource does not exists", function() {
        acl
          .addResource('testResource')
        ;

        var resource = acl.getResource('testResource');
        expect(resource.getResourceId()).toEqual('testResource');
      });

      it("when the resource does not exists but the parent does exist", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
          .addResource('resourceC', 'resourceB')
        ;

        var children = acl.getChildResources('resourceA');

        expect('resourceB' in children).toBe(true);
        expect('resourceC' in children).toBe(true);

        var resourceB = children['resourceB'];
        var resourceC = children['resourceC'];

        expect(resourceB.getResourceId()).toEqual('resourceB');
        expect(resourceC.getResourceId()).toEqual('resourceC');
      });

    });
  });

  describe("getResource", function() {
    describe("fails", function() {
      it("when a resource does not exists", function() {
        expect(function() {
          acl.getResource('unknownResource');
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when a resource does exists", function() {
        acl.addResource('testResource');

        var resource = acl.getResource('testResource');
        expect(resource.getResourceId()).toEqual('testResource');
      });
    });
  });

  describe("hasResource", function() {
    describe("fails", function() {
      it("when a resource does not exists", function() {
        expect(acl.hasResource('unknownResource')).toBe(false);
      });
    });

    describe("succeeds", function() {
      it("when a resource does exist", function() {
        expect(acl.addResource('testResource').hasResource('testResource')).toBe(true);
      });
    });
  });

  describe("inheritsResource", function() {
    describe("fails", function() {
      it("the resource does not inherit", function() {
        acl.addResource('resourceA');
        acl.addResource('resourceB');

        expect(acl.inheritsResource('resourceA', 'resourceB')).toBe(false);
      });

      it("the resource is not a direct inherit but when it should be", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
          .addResource('resourceC', 'resourceB')
        ;

        expect(acl.inheritsResource('resourceC', 'resourceA', true)).toBe(false);
      });
    });

    describe("succeeds", function() {
      it("when a resource directly inherits from another resource", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
        ;

        expect(acl.inheritsResource('resourceB', 'resourceA', true)).toBe(true);
      });

      it("when a resource indirectly inherits from another resource", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
          .addResource('resourceC', 'resourceB')
        ;

        expect(acl.inheritsResource('resourceC', 'resourceA')).toBe(true);
      });
    });
  });

  describe('removeResource', function() {
    describe("fails", function() {
      it("when a resource does not exists", function() {
        expect(function() {
          acl.removeResource('unknownResource')
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when the resource exists", function() {
        acl.addResource('testResource');
        acl.removeResource('testResource');

        expect(function() {
          acl.getResource('testResource');
        })
        .toThrowError(Error);
      });

      it("when child resource are removed", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
        ;

        acl.removeResource('resourceA');

        expect(function() {
          acl.getResource('resourceB')
        })
        .toThrowError(Error);

        expect(function() {
          acl.getResource('resourceA')
        })
        .toThrowError(Error);
      });
    });
  });

  describe('removeResourceAll', function() {
    it("fails", function() {
      // The method has no code path for failure, so it shouldn't fail.
    });

    describe("succeeds", function() {
      it("when resources exist", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
          .addResource('resourceC', 'resourceB')
        ;
        
        expect(Object.keys(acl.resources).length).toEqual(3);
        acl.removeResourceAll();
        expect(Object.keys(acl.resources).length).toEqual(0);
      });
    });
  });

  describe('getChildResources', function() {
    describe("fails", function() {
      it("when the resource does not exists", function() {
        expect(function() {
          acl.getChildResources('unknownResource');
        })
        .toThrowError(Error);
      });
    });

    describe("succeeds", function() {
      it("when the resource does not exists but the parent does exist", function() {
        acl
          .addResource('resourceA')
          .addResource('resourceB', 'resourceA')
          .addResource('resourceC', 'resourceB')
        ;

        var children = acl.getChildResources('resourceA');

        expect('resourceB' in children).toBe(true);
        expect('resourceC' in children).toBe(true);

        var resourceB = children['resourceB'];
        var resourceC = children['resourceC'];

        expect(resourceB.getResourceId()).toEqual('resourceB');
        expect(resourceC.getResourceId()).toEqual('resourceC');
      });
    });
  });

  describe("testBlog", function() {

    describe("succeeds", function() {

      beforeEach(function() {
        acl.addRole('visitor');
        acl.addRole('member', 'visitor');
        acl.addRole('publisher', 'member');
        acl.addRole('editor', 'publisher');
        acl.addRole('admin');

        acl.addResource('page');
        acl.addResource('post');
        acl.addResource('comment');
        acl.addResource('profile');

        acl.allow('visitor', ['page', 'post', 'comment'], 'view');
        acl.allow('member', ['profile'], ['view', 'edit']);
        acl.allow('member', ['comment'], ['create', 'edit']);
        acl.allow('member', ['post', 'comment'], 'like');
        acl.allow('publisher', ['page', 'post'], ['create', 'edit', 'publish']);
        acl.allow('editor', ['page', 'post', 'comment'], 'delete');
        acl.allow('admin', null, null);
        //console.log( JSON.stringify(acl, null, 2) );
      });

      // Visitor
      it("visitor can view page", function() {
        expect( acl.isAllowed('visitor', 'page', 'view') ).toBe(true);
      });

      it("visitor can view post", function() {
        expect( acl.isAllowed('visitor', 'post', 'view') ).toBe(true);
      });
      
      it("visitor can view comment", function() {
        expect( acl.isAllowed('visitor', 'comment', 'view') ).toBe(true);
      });
      
      it("visitor can view profile", function() {
        expect( acl.isAllowed('visitor', 'profile', 'view') ).toBe(false);
      });
      
      it("visitor can not edit page", function() {
        expect( acl.isAllowed('visitor', 'page', 'edit') ).toBe(false);
      });
      
      it("visitor can not edit post", function() {
        expect( acl.isAllowed('visitor', 'post', 'edit') ).toBe(false);
      });
      
      it("visitor can not edit comment", function() {
        expect( acl.isAllowed('visitor', 'comment', 'edit') ).toBe(false);
      });
      
      it("visitor can not edit profile", function() {
        expect( acl.isAllowed('visitor', 'profile', 'edit') ).toBe(false);
      });
      
      it("visitor can not like comment", function() {
        expect( acl.isAllowed('visitor', 'comment', 'like') ).toBe(false);
      });
      
      it("visitor can not like post", function() {
        expect( acl.isAllowed('visitor', 'post', 'like') ).toBe(false);
      });
      
      // Member
      it("member can view page", function() {
        expect( acl.isAllowed('member', 'page', 'view') ).toBe(true);
      });
      
      it("member can view post", function() {
        expect( acl.isAllowed('member', 'post', 'view') ).toBe(true);
      });
      
      it("member can view comment", function() {
        expect( acl.isAllowed('member', 'comment', 'view') ).toBe(true);
      });
      
      it("member can view profile", function() {
        expect( acl.isAllowed('member', 'profile', 'view') ).toBe(true);
      });
      
      it("member can not edit page", function() {
        expect( acl.isAllowed('member', 'page', 'edit') ).toBe(false);
      });
      
      it("member can not edit post", function() {
        expect( acl.isAllowed('member', 'post', 'edit') ).toBe(false);
      });
      
      it("member can create comment", function() {
        expect( acl.isAllowed('member', 'comment', 'create') ).toBe(true);
      });
      
      it("member can edit comment", function() {
        expect( acl.isAllowed('member', 'comment', 'edit') ).toBe(true);
      });
      
      it("member can edit profile", function() {
        expect( acl.isAllowed('member', 'profile', 'edit') ).toBe(true);
      });
      
      it("member can like comment", function() {
        expect( acl.isAllowed('member', 'comment', 'like') ).toBe(true);
      });
      
      it("member can like post", function() {
        expect( acl.isAllowed('member', 'post', 'like') ).toBe(true);
      });
      
      // Publisher
      it("publisher can view page", function() {
        expect( acl.isAllowed('publisher', 'page', 'view') ).toBe(true);
      });
      
      it("publisher can view post", function() {
        expect( acl.isAllowed('publisher', 'post', 'view') ).toBe(true);
      });
      
      it("publisher can view comment", function() {
        expect( acl.isAllowed('publisher', 'comment', 'view') ).toBe(true);
      });
      
      it("publisher can view profile", function() {
        expect( acl.isAllowed('publisher', 'profile', 'view') ).toBe(true);
      });
      
      it("publisher can create page", function() {
        expect( acl.isAllowed('publisher', 'page', 'create') ).toBe(true);
      });
      
      it("publisher can edit page", function() {
        expect( acl.isAllowed('publisher', 'page', 'edit') ).toBe(true);
      });
      
      it("publisher can publish page", function() {
        expect( acl.isAllowed('publisher', 'page', 'publish') ).toBe(true);
      });
      
      it("publisher can create post", function() {
        expect( acl.isAllowed('publisher', 'post', 'create') ).toBe(true);
      });
      
      it("publisher can edit post", function() {
        expect( acl.isAllowed('publisher', 'post', 'edit') ).toBe(true);
      });
      
      it("publisher can publish post", function() {
        expect( acl.isAllowed('publisher', 'post', 'publish') ).toBe(true);
      });
      
      it("publisher can create comment", function() {
        expect( acl.isAllowed('publisher', 'comment', 'create') ).toBe(true);
      });
      
      it("publisher can edit comment", function() {
        expect( acl.isAllowed('publisher', 'comment', 'edit') ).toBe(true);
      });
      
      it("publisher can edit profile", function() {
        expect( acl.isAllowed('publisher', 'profile', 'edit') ).toBe(true);
      });
      
      it("publisher can like comment", function() {
        expect( acl.isAllowed('publisher', 'comment', 'like') ).toBe(true);
      });
      
      it("publisher can like post", function() {
        expect( acl.isAllowed('publisher', 'post', 'like') ).toBe(true);
      });
      
      // Editor
      it("edit can view page", function() {
        expect( acl.isAllowed('editor', 'page', 'view') ).toBe(true);
      });
      
      it("editor can view post", function() {
        expect( acl.isAllowed('editor', 'post', 'view') ).toBe(true);
      });
      
      it("editor can view comment", function() {
        expect( acl.isAllowed('editor', 'comment', 'view') ).toBe(true);
      });
      
      it("editor can view profile", function() {
        expect( acl.isAllowed('editor', 'profile', 'view') ).toBe(true);  
      });
      
      it("editor can create page", function() {
        expect( acl.isAllowed('editor', 'page', 'create') ).toBe(true);
      });
      
      it("editor can edit page", function() {
        expect( acl.isAllowed('editor', 'page', 'edit') ).toBe(true);
      });
      
      it("edit can publish page", function() {
        expect( acl.isAllowed('editor', 'page', 'publish') ).toBe(true);
      });
      
      it("editor can create post", function() {
        expect( acl.isAllowed('editor', 'post', 'create') ).toBe(true);
      });
      
      it("editor can edit post", function() {
        expect( acl.isAllowed('editor', 'post', 'edit') ).toBe(true);
      });
      
      it("editor can publish post", function() {
        expect( acl.isAllowed('editor', 'post', 'publish') ).toBe(true);
      });
      
      it("editor can create command", function() {
        expect( acl.isAllowed('editor', 'comment', 'create') ).toBe(true);
      });
      
      it("editor can edit comment", function() {
        expect( acl.isAllowed('editor', 'comment', 'edit') ).toBe(true);
      });
      
      it("editor can edit profile", function() {
        expect( acl.isAllowed('editor', 'profile', 'edit') ).toBe(true);
      });
      
      it("editor can like comment", function() {
        expect( acl.isAllowed('editor', 'comment', 'like') ).toBe(true);
      });
      
      it("editor can like post", function() {
        expect( acl.isAllowed('editor', 'post', 'like') ).toBe(true);
      });
      
      it("editor can delete page", function() {
        expect( acl.isAllowed('editor', 'page', 'delete') ).toBe(true);  
      });
      
      it("editor can delete post", function() {
        expect( acl.isAllowed('editor', 'post', 'delete') ).toBe(true);
      });
      
      // Admin
      it("admin can do everything", function() {
        expect( acl.isAllowed('admin', 'page', 'delete') ).toBe(true);  
        expect( acl.isAllowed('admin', 'page', 'create') ).toBe(true);
        expect( acl.isAllowed('admin', 'profile', 'delete') ).toBe(true);  
      });
      
    });

  });

  describe("removeAllow", function() {
    beforeEach(function() {
      acl
        .addRole('guest')
        .addResource('blogpost')
        .addResource('newsletter')
        .allow('guest', 'blogpost', 'read')
        .allow('guest', 'newsletter', 'read')
      ;
    });

    describe("guest can read blogpost and newsletter", function() {
      it("guest can read blogpost", function() {
        expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(true);
      });
      
      it("guest can read newsletter", function() {
        expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(true);
      });      
    });

    it("guest can no longer read newsletter", function() {
      acl.removeAllow('guest', 'newsletter', 'read');
      
      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(false);
    });

    it("guest can no longer read anything", function() {
      acl.removeAllow('guest', null, 'read');

      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(false);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(false);
    });
  });

  describe("allowReadAll", function() {
    beforeEach(function() {
      acl
        .addRole('guest')
        .addResource('blogpost')
        .addResource('newsletter')
        .allow('guest', null, 'read');
      ;
    });

    it("guest can read all", function() {
      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(true);
    });
  });

  describe("testRemoveDenyWithNullResourceAppliesToAllResources", function() {
    it("should work", function() {

      acl.addRole('guest');
      acl.addResource('blogpost');
      acl.addResource('newsletter');
      
      acl.allow();
      acl.deny('guest', 'blogpost', 'read');
      acl.deny('guest', 'newsletter', 'read');
      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(false);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(false);
      
      acl.removeDeny('guest', 'newsletter', 'read');
      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(false);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(true);
      
      acl.removeDeny('guest', null, 'read');
      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(true);
      
      // ensure deny null/all resources works
      acl.deny('guest', null, 'read');
      expect( acl.isAllowed('guest', 'blogpost', 'read') ).toBe(false);
      expect( acl.isAllowed('guest', 'newsletter', 'read') ).toBe(false);
    });
  });

  describe("testAclResourcePermissionsAreInheritedWithMultilevelResourcesAndDenyPolicy", function() {
    it("should work", function() {
      acl.addRole('guest');
      acl.addResource('blogposts');
      acl.addResource('feature', 'blogposts');
      acl.addResource('post_1', 'feature');
      acl.addResource('post_2', 'feature');

      // Allow a guest to read feature posts and
      // comment on everything except feature posts.
      acl.deny();
      acl.allow('guest', 'feature', 'read');
      acl.allow('guest', null, 'comment');
      acl.deny('guest', 'feature', 'comment');

      expect( acl.isAllowed('guest', 'feature', 'write') ).toBe(false);
      expect( acl.isAllowed('guest', 'post_1', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'post_2', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'post_1', 'comment') ).toBe(false);
      expect( acl.isAllowed('guest', 'post_2', 'comment') ).toBe(false);
    });
  });

  describe("permissions loading", function() {
    it("succeeds", function() {

      var permissions = {
        roles: [
          {name: 'guest'},
          {name: 'member', parent: 'guest' },
          {name: 'author', parent: 'member'},
          {name: 'admin'},
        ],
        resources: [
          {name: 'post'},
          {name: 'comment'},
        ],
        rules: [
          {
            // guest can view everything.
            access:     'allow',
            role:       'guest',
            privileges: ['read'],
            resources:  null,
          }, {
            // member can create comment.
            access:     'allow',
            role:       'member',
            privileges: ['create'],
            resources:  ['comment'],
          }, {
            // author can create/update/delete post.
            access:     'allow',
            role:       'author',
            privileges: ['create', 'update', 'delete'],
            resources:  ['post'],
          }, {
            // admin can do everything.
            access:     'allow',
            role:       'admin',
            privileges: null,
            resources:  null,
          }
        ],
      };

      acl = new Acl(permissions);

      expect( acl.isAllowed('guest', 'post', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'comment', 'read') ).toBe(true);
      expect( acl.isAllowed('guest', 'post', 'create') ).toBe(false);
      expect( acl.isAllowed('guest', 'post', 'update') ).toBe(false);
      expect( acl.isAllowed('guest', 'post', 'delete') ).toBe(false);

      expect( acl.isAllowed('member', 'post', 'read') ).toBe(true);
      expect( acl.isAllowed('member', 'comment', 'read') ).toBe(true);
      expect( acl.isAllowed('member', 'post', 'create') ).toBe(false);
      expect( acl.isAllowed('member', 'comment', 'create') ).toBe(true);

      expect( acl.isAllowed('author', 'post', 'read') ).toBe(true);
      expect( acl.isAllowed('author', 'comment', 'read') ).toBe(true);
      expect( acl.isAllowed('author', 'post', 'create') ).toBe(true);
      expect( acl.isAllowed('author', 'post', 'update') ).toBe(true);
      expect( acl.isAllowed('author', 'post', 'delete') ).toBe(true);
      expect( acl.isAllowed('author', 'comment', 'create') ).toBe(true);

      expect( acl.isAllowed('admin', 'post', 'read') ).toBe(true);
      expect( acl.isAllowed('admin', 'comment', 'read') ).toBe(true);
      expect( acl.isAllowed('admin', 'post', 'create') ).toBe(true);
      expect( acl.isAllowed('admin', 'post', 'update') ).toBe(true);
      expect( acl.isAllowed('admin', 'post', 'delete') ).toBe(true);
      expect( acl.isAllowed('admin', 'comment', 'create') ).toBe(true);
      expect( acl.isAllowed('admin', 'comment', 'update') ).toBe(true);
      expect( acl.isAllowed('admin', 'comment', 'delete') ).toBe(true);
    });

  });
});
