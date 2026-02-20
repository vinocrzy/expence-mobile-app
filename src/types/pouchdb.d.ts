/**
 * Type declarations for PouchDB modules without official types
 */

declare module 'pouchdb-adapter-memory' {
  const plugin: PouchDB.Plugin;
  export default plugin;
}

declare module 'pouchdb-adapter-http' {
  const plugin: PouchDB.Plugin;
  export default plugin;
}

declare module 'pouchdb-mapreduce' {
  const plugin: PouchDB.Plugin;
  export default plugin;
}

declare module 'pouchdb-replication' {
  const plugin: PouchDB.Plugin;
  export default plugin;
}

declare module 'pouchdb-find' {
  const plugin: PouchDB.Plugin;
  export default plugin;
}
