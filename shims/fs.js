// Empty shim for Node's 'fs' module.
// PouchDB's abstract-leveldown references fs but never actually uses it
// in the browser/memory adapter path. This prevents Metro from erroring.
module.exports = {};
