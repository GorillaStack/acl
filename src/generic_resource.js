
"use strict";

function GenericResource(resourceId) {
  this.resourceId = resourceId;
}

GenericResource.prototype.getResourceId = function() {
  return this.resourceId;
}

exports = module.exports = GenericResource;
