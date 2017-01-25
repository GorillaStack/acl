[![Build Status](https://travis-ci.org/GorillaStack/acl.svg?branch=master)](https://travis-ci.org/GorillaStack/acl)

# ACL

ACL is a JavaScript library based on the [Zend Permissions ACL](https://github.com/zendframework/zend-permissions-acl) library that works equally well on the server as in the browser.

## Introduction

ACL is a role/resource based ACL that allows for easy definition of permissions by combining rules for specific roles, resources and privileges. Roles can inherit from earlier defined roles and resources can inherit from earlier defined resources. After the ACL is loaded with a permissions set, easy testing through the `isAllowed` method returns either a `true` or `false` value.

## Installation

TODO: Install through npm.

## Tests

To run the tests, after cloning this repository first install the required dependencies:

    npm install

You can now run the tests by issuing the following command:

    ./node_modules/.bin/jasmine

# Usage

To use ACL start by defining a permissions list. We can start with an empty list:

```javascript
var permissions = {
  roles:     [],
  resources: [],
  rules:     []
};
```

Our permissions list contains three top-level requirements, `roles`, `resources` and `rules`. The idea behind this role based ACL is that a specific role has access to resources through specified rules. Don't confuse the elements you define in this list with 'real' objects in your application. The ACL is simply be a structure (or model) we can test against, it can be static and therefore it's not required to be stored in a database. You can define the ACL as a business object in your application or as part of your business rules. However, if you prefer, or if your ACL is dynamic, you can store the permissions set in database if you wish to do so.

OK. Let's add some permissions..

For the purpose of this demonstration we define four roles; `guest`, `member`, `author` and `admin`. For the sake of argument, we define the resources for a simple blog so we have `post` and `comment` as resources:

```javascript
var permissions = {
  roles: [
    {name: "guest"},
    {name: "member", parent: "guest"},
    {name: "author", parent: "member"},
    {name: "admin"}
  ],
  resources: [
    {name: "post"},
    {name: "comment"}
  ],
  rules: []
};
```

Easy as. Now lets define a rule that allows guests to `view` both `posts` and `comments`:

```javascript
var permissions = {
  roles: [
    {name: "guest"},
    {name: "member", parent: "guest"},
    {name: "author", parent: "member"},
    {name: "admin"}
  ],
  resources: [
    {name: "post"},
    {name: "comment"}
  ],
  rules: [
    {
      access:     "allow",
      role:       "guest",
      privileges: ["view"],
      resources:  ["post", "comment"]
    }
  ]
};
```

As you can see, the rule is pretty straight forward. both `privileges` and `resources` can either be set as single values or as an array. Notice how the values on the right hand side can be read in a meaningful way; "allow guest to view post & comment".

Now, let's create a rule that allows `members` to create `comments`:

```javascript
var permissions = {
  roles: [
    {name: "guest"},
    {name: "member", parent: "guest"},
    {name: "author", parent: "member"},
    {name: "admin"}
  ],
  resources: [
    {name: "post"},
    {name: "comment"}
  ],
  rules: [
    {
      access:     "allow",
      role:       "guest",
      privileges: ["view"],
      resources:  ["post", "comment"]
    }, {
      access:     "allow",
      role:       "member",
      privileges: ["create"],
      resources:  ["comment"]
    }
  ]
};
```

Great. Now let's fill in the rest of the permissions:

```javascript
var permissions = {
  roles: [
    {name: "guest"},
    {name: "member", parent: "guest"},
    {name: "author", parent: "member"},
    {name: "admin"}
  ],
  resources: [
    {name: "post"},
    {name: "comment"}
  ],
  rules: [
    {
      access:     "allow",
      role:       "guest",
      privileges: ["view"],
      resources:  ["post", "comment"]
    }, {
      access:     "allow",
      role:       "member",
      privileges: ["create"],
      resources:  ["comment"]
    }, {
      access:     "allow",
      role:       "author",
      privileges: ["create", "edit", "delete"],
      resources:  ["post"]
    }, {
      access:     "allow",
      role:       "admin",
      privileges: null,
      resources:  null
    }
  ]
};
```

We added the `author` permissions to allow authors to create, edit and delete posts and we've allowed the `admin` to perform all privileges (`null`) or all resources (`null`).

To use the permissions we need to load the permissions into the ACL, like this:

```javascript
var acl = new Acl(permissions);
```

We can now test if a specified role can perform a requested privilege on a specified resource. E.g:

```javascript
acl.isAllowed('guest', 'post', 'view');
// true

acl.isAllowed('member', 'post', 'delete');
// false

acl.isAllowed('admin', 'post', 'delete');
// true
```

That's easy as!
