#!/bin/bash

wget https://github.com/sagiegurari/simple-oracledb/archive/master.zip
unzip -q master.zip
cd ./simple-oracledb-master

export OCI_LIB_DIR="/opt/oracle/instantclient"

echo "----------------"
echo "OCI_LIB_DIR: $OCI_LIB_DIR"
echo "----------------"
echo "OCI_INCLUDE_DIR: $OCI_INCLUDE_DIR"
echo "----------------"

npm --loglevel error -g --production install mocha

npm --loglevel error --production install

npm --loglevel error --production install chai

npm --loglevel error --production --unsafe-perm install oracledb

export TEST_ORACLE_CONNECTION_STRING="(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${DB_PORT_1521_TCP_ADDR})(PORT=${DB_PORT_1521_TCP_PORT}))(CONNECT_DATA=(SID=xe)))"

echo "TEST_ORACLE_USER: ${TEST_ORACLE_USER}"
echo "TEST_ORACLE_PASSWORD: ${TEST_ORACLE_PASSWORD}"
echo "TEST_ORACLE_CONNECTION_STRING: ${TEST_ORACLE_CONNECTION_STRING}"

#wait for db to be up
sleep 60

mocha --exit ./test/spec/integration-spec.js
