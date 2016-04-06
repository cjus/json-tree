'use strict';

const fs = require('fs');
const jsPath = require('jspath');

class JSONTree {
  constructor() {
    this.tree = {};
    this.treeName = '';
    this.branchSegments = [];
  }

  /**
  * @name _isObject
  * @summary Determines whether a node is an object
  * @param {object} node - node being examined
  * @return {boolean} - true if object else false
  */
  _isObject(node) {
    return (typeof node === 'object' && Object.prototype.toString.call(node) !== '[object Array]');
  }

  /**
  * @name _getPathName
  * @summary Retrieves the name of the branch a segment points to.
  * @private
  * @param {string} path - tree path
  * @return {string|null} - segment name or null
  */
  _getPathName(path) {
    let segments = path.split('/');
    if (segments === 0) {
      return path;
    }
    let newSegments = segments.filter((item) => item.length !== 0);
    return newSegments[newSegments.length - 1] || null;
  }

  /**
  * @name _getDataName
  * @summary Retrieves the name of a data object.
  * @description The name is defined as the first and only root key in a object.
  * @param {object} data - data object
  * @return {string} string - object key name
  */
  _getDataName(data) {
    return Object.keys(data)[0];
  }

  /**
  * @name _pathWalker
  * @summary Walks a tree path
  * @description Walks a tree path and returns the node at the end of the path or null
  * @param {string} path - path to walk
  * @return {object | null} base - node at end of path or null if path not found
  */
  _pathWalker(path) {
    let base = this.tree;
    let segments = path
      .split('/')
      .filter((item) => item.length !== 0);
    if (segments.length === 0) {
      return base;
    }
    for (let segment of segments) {
      if (!base[segment] || !this._isObject(base[segment])) {
        return null;
      }
      base = base[segment];
    }
    if (!this._isObject(base)) {
      return null;
    }
    return base;
  }

  /**
  * @name _validatePath
  * @summary Validates a tree path
  * @private
  * @param {string} path - path to validate
  * @return {boolean} bool - true if valid, false if not
  */
  _validatePath(path) {
    return (this._pathWalker(path));
  }

  /**
  * @name _validateData
  * @summary Validates that a data object has only one key.
  * @private
  * @param {object} data - data object with one key pointing to a single top-level object
  * @return {boolean} ret - true if valid, false otherwise
  */
  _validateData(data) {
    let ret = false;
    let keys = Object.keys(data);
    if (keys.length === 1 && typeof keys[0] === 'object') {
      ret = true;
    }
    return ret;
  }

  /**
  * @name _appendBranch
  * @summary Appends a branch to a path location
  * @private
  * @param {string} path - path to validate
  * @param {object} data - data to append
  * @return {boolean} bool - true if valid, false otherwise
  */
  _appendBranch(path, data) {
    let ret = false;
    let node = this._pathWalker(path);
    if (node) {
      let branchName = this._getDataName(data);
      node[branchName] = data[branchName];
      ret = true;
    }
    return ret;
  }

  /**
  * @name _generatePaths
  * @summary Creates a list of branch segments
  * @private
  * @param {object} branch - node being examined
  * @param {array} segments - segment path
  */
  _generatePaths(branch, segments) {
    segments = segments || [];
    Object
      .keys(branch)
      .map((node) => {
        if (this._isObject(branch[node])) {
          segments.push(node);
          this.branchSegments.push(segments.join('/'));
          this._generatePaths(branch[node], segments);
          segments.pop();
        }
      });
  }
}

class IJSONTree extends JSONTree {
  constructor() {
    super();
  }

  /**
  * @name setTree
  * @summary Sets the root tree
  * @param {object} obj - object which will become the root tree
  */
  setTree(obj) {
    this.tree = obj;
    this.treeName = Object.keys(this.tree)[0];
  }

  /**
  * @name getTreeName
  * @summary Retrieve the trees name
  * @description The trees name is defined as the first key in the object tree.
  * @return {string} name - tree name
  */
  getTreeName() {
    return this.treeName;
  }

  /**
  * @name getTree
  * @summary Retrieves the internal tree
  * @return {object} tree - internal tree
  */
  getTree() {
    return this.tree;
  }

  /**
  * @name exportTree
  * @summary Exports the tree into an array of elements suitable for serialization in external stores
  * @return {array} array - list of nodes
  */
  exportTree() {
    let branchList = [];
    let branches = this.getBranches();
    branches.map((path) => {
      let node = this.getBranch(path);
      let name = this._getPathName(path);
      let data = Object.assign({}, node);
      Object.keys(data)
        .map((item) => {
          if (this._isObject(data[item])) {
            delete data[item];
          }
        });
      branchList.push({
        path,
        name,
        data
      });
    });

    return branchList;
  }

  /**
  * @name load
  * @summary Loads a JSON file
  * @param {string} path - path to JSON file
  * @return {object|undefined} - based on whether file was loaded.
  */
  load(path) {
    let data;
    try {
      data = fs.readFileSync(path);
      data = JSON.parse(data.toString());
    } catch (e) {
      console.log(e.message);
    }
    return data;
  }

  /**
  * @name appendBranch
  * @summary Appends a branch at the specified path
  * @param {string} path - tree path to append to
  * @param {object} data - object to append
  * @return {boolean} bool - true if valid, false if not
  */
  appendBranch(path, data) {
    let ret;
    if (this._validatePath(path)) {
      this._appendBranch(path, data);
      ret = true;
    } else {
      ret = false;
    }
    return ret;
  }

  /**
  * @name getBranches
  * @summary Retrieves an array of branch segments
  * @return {array} values - and array of branch segments
  */
  getBranches() {
    this.branchSegments = [];
    this._generatePaths(this.tree);
    return this.branchSegments;
  }

  /**
  * @name getBranch
  * @summary Attempts to find a brach path
  * @param {string} path - tree path
  * @return {object|null} return - a branch node or null if not found
  */
  getBranch(path) {
    return this._pathWalker(path);
  }

  /**
  * @name deleteBranch
  * @summary Remove a branch based on path
  * @param {string} path - path of branch to delete
  * @return {boolean} ret - true if successful or false if paath is invalid or branch can't be found
  */
  deleteBranch(path) {
    let base = this.tree;
    let parent = base;
    let branchName = this._getPathName(path);
    let segments = path
      .split('/')
      .filter((item) => item.length !== 0);
    if (segments.length === 1) {
      return false; // can't delete root
    }
    for (let segment of segments) {
      if (!base[segment] || typeof base !== 'object') {
        return false;
      }
      parent = base;
      base = base[segment];
    }
    if (typeof base !== 'object') {
      return false;
    }
    delete parent[branchName];
    return true;
  }

  /**
  * @name moveBranch
  * @summary move a branch to another location
  * @param {string} fromPath - branch path that will be relocated
  * @param {string} toPath - destination branch to locate source branch to.
  * @return {boolean} ret - true if successful or false
  */
  moveBranch(fromPath, toPath) {
    let src = this.getBranch(fromPath);
    if (!src) {
      return false;
    }
    let dst = this.getBranch(toPath);
    if (!dst) {
      return false;
    }
    dst[this._getPathName(fromPath)] = src;
    return this.deleteBranch(fromPath);
  }

  /**
  * @name query
  * @summary query an object
  * @description JSON Tree Query uses JSPath.
  * @see https://github.com/dfilatov/jspath
  * @param {path} path - path to apply query to
  * @param {string} queryString - query string pattern
  * @return {object | null} return data | or null if path is invalid
  */
  query(path, queryString) {
    let data = this.getBranch(path);
    if (data === null) {
      return null;
    }
    return jsPath.apply(queryString, data);
  }

  /**
  * @name getPathName
  * @summary Retrieves the name of a path
  * @description The name of a path is defined as the last segment portion of the path
  * @param {string} path - path branch
  * @return {string} name - name of path
  */
  getPathName(path) {
    return this._getPathName(path);
  }

  /**
  * @name getPathPrefix
  * @summary Retrieves the path's prefix portion
  * @description The prefix is defined as the text which preceeds the path name
  * @param {string} path - path branch
  * @return {string} prefix - the path's prefix
  */
  getPathPrefix(path) {
    let name = this.getPathName(path);
    let prefix = path.substring(0, path.length - name.length);
    let len = prefix.length - 1;
    if (prefix[len] === '/') {
      prefix = prefix.substring(0, len);
    }
    return prefix;
  }

  /**
  * @name prettyFormat
  * @summary Formats JSON in a pretty string format.
  * @description useful with console.log(jt.prettyFormt(data));
  * @param {object} data - data for stringify and formatt
  * @param {number} indent - number of spaces to indent = defaults to 2
  * @return {string} output - formatted string
  */
  prettyFormat(data, indent) {
    indent = indent || 2;
    return JSON.stringify(data, null, indent);
  }

  /**
  * @name prettyPrint
  * @summary Pretty Prints JSON data to the console.
  * @param {object} data - data to print
  */
  prettyPrint(data) {
    console.log(this.prettyFormat(data));
  }
}

module.exports = new IJSONTree();

//TODO(CJ): do better data object validation
//Upgrade to use ImmutableJS
