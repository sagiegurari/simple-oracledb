| Date        | Version | Description |
| ----------- | ------- | ----------- |
| 2017-10-04  | v1.1.86 | Maintenance |
| 2017-01-20  | v1.1.57 | connection.run, connection.transaction and oracledb.run actions can now return a promise instead of using a callback |
| 2017-01-14  | v1.1.56 | pool.run actions now can return a promise instead of using a callback |
| 2017-01-13  | v1.1.55 | Maintenance |
| 2016-12-28  | v1.1.50 | Added pool.parallelQuery which enables parallel queries using multiple connections |
| 2016-12-20  | v1.1.49 | Maintenance |
| 2016-11-15  | v1.1.41 | Added connection.executeFile to read SQL statement from file and execute it |
| 2016-11-05  | v1.1.40 | Maintenance |
| 2016-10-07  | v1.1.26 | Added oracledb.run |
| 2016-10-06  | v1.1.25 | Maintenance |
| 2016-08-15  | v1.1.2  | Added 'metadata' event for connection.query with streaming |
| 2016-08-15  | v1.1.1  | Maintenance |
| 2016-08-10  | v1.1.0  | Breaking change connection.run and connection.transaction default is now sequence instead of parallel |
| 2016-08-09  | v1.0.2  | Added connection.run |
| 2016-08-09  | v1.0.1  | Maintenance |
| 2016-08-07  | v0.1.98 | NODE_DEBUG=simple-oracledb will now also log all SQL statements and bind params for the connection.execute function |
| 2016-08-05  | v0.1.97 | Maintenance |
| 2016-08-05  | v0.1.96 | Extensions are now automatically promisified |
| 2016-08-05  | v0.1.95 | Added promise support for all library APIs |
| 2016-08-03  | v0.1.94 | Maintenance |
| 2016-07-26  | v0.1.84 | Add integration test via docker |
| 2016-07-24  | v0.1.83 | Add support for node-oracledb promise |
| 2016-07-23  | v0.1.82 | Maintenance |
| 2016-07-17  | v0.1.80 | Add support for node-oracledb promise |
| 2016-07-14  | v0.1.79 | Fixed possible max stack size error |
| 2016-07-13  | v0.1.78 | Maintenance |
| 2016-05-01  | v0.1.57 | Added the new monitor (SimpleOracleDB.diagnosticInfo and SimpleOracleDB.enableDiagnosticInfo) and SimpleOracleDB is now an event emitter |
| 2016-04-27  | v0.1.54 | Maintenance |
| 2016-03-31  | v0.1.51 | Added new stream.close function to stop streaming data and free the connection for more operations |
| 2016-03-09  | v0.1.50 | Maintenance |
| 2016-03-03  | v0.1.40 | Connection and Pool are now event emitters |
| 2016-03-02  | v0.1.39 | Maintenance |
| 2016-03-02  | v0.1.38 | Added new force option for connection.release/close |
| 2016-02-28  | v0.1.37 | Added SimpleOracleDB.addExtension which allows to further extend oracledb |
| 2016-02-28  | v0.1.36 | Maintenance |
| 2016-02-22  | v0.1.32 | Added new pool.run operation |
| 2016-02-21  | v0.1.31 | Maintenance |
| 2016-02-16  | v0.1.29 | new optional options.returningInfo to insert/update/batch to enable to modify the returning/into clause when using LOBs |
| 2016-02-16  | v0.1.28 | Maintenance |
| 2016-02-12  | v0.1.26 | Added sequence option for connection.transaction and added pool.close=pool.terminate, connection.close=connection.release aliases |
| 2016-02-11  | v0.1.25 | Maintenance |
| 2016-02-10  | v0.1.23 | Adding debug logs via NODE_DEBUG=simple-oracledb |
| 2016-02-09  | v0.1.22 | Maintenance |
| 2016-02-09  | v0.1.20 | connection.release now supports retry options |
| 2016-02-02  | v0.1.19 | Maintenance |
| 2016-01-22  | v0.1.18 | Fixed missing call to resultset.close after done reading |
| 2016-01-20  | v0.1.17 | Maintenance |
| 2016-01-12  | v0.1.8  | Avoid issues with oracledb stream option which is based on this library |
| 2016-01-07  | v0.1.7  | connection.query with streamResults=true returns a readable stream |
| 2015-12-30  | v0.1.6  | connection.transaction disables commit/rollback while running |
| 2015-12-29  | v0.1.5  | Maintenance |
| 2015-12-29  | v0.1.4  | Added connection.transaction |
| 2015-12-29  | v0.1.3  | Added connection.batchUpdate |
| 2015-12-22  | v0.1.2  | Added streaming of query results with new option streamResults=true |
| 2015-12-21  | v0.1.1  | Rename streamResults to splitResults |
| 2015-12-21  | v0.0.36 | Maintenance |
| 2015-12-21  | v0.0.35 | New bulkRowsAmount option to manage query resultset behaviour |
| 2015-12-21  | v0.0.34 | Added splitting of query results into bulks with new option splitResults=true |
| 2015-12-17  | v0.0.33 | Maintenance |
| 2015-12-08  | v0.0.24 | Added pool.getConnection connection validation via running SQL test command |
| 2015-11-30  | v0.0.23 | Maintenance |
| 2015-11-17  | v0.0.17 | Added pool.getConnection automatic retry |
| 2015-11-15  | v0.0.16 | Added connection.batchInsert and connection.rollback |
| 2015-11-05  | v0.0.15 | Maintenance |
| 2015-10-20  | v0.0.10 | Added connection.queryJSON |
| 2015-10-19  | v0.0.9  | autoCommit support when doing INSERT/UPDATE with LOBs |
| 2015-10-19  | v0.0.7  | Added pool.terminate |
| 2015-10-19  | v0.0.6  | Maintenance |
| 2015-10-18  | v0.0.5  | Added connection.update |
| 2015-10-18  | v0.0.4  | Added connection.insert |
| 2015-10-16  | v0.0.3  | Maintenance |
| 2015-10-15  | v0.0.1  | Initial release. |
