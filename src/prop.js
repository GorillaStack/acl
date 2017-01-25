
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

exports = module.exports = {
  get: get,
  set: set
};
