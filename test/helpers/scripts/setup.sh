#!/bin/sh

# this script should be invoked from the project root
# run oracle DB
docker run -d -p 1521:1521 -e ORACLE_ALLOW_REMOTE=true oracleinanutshell/oracle-xe-11g

# install oracle client
mkdir -p ./target/oracleclient
cd ./target/oracleclient
wget https://download.oracle.com/otn_software/linux/instantclient/213000/instantclient-basiclite-linux.x64-21.3.0.0.0.zip .
unzip ./*.zip
cd ./instantclient_*
export NODE_ORACLE_CLIENT_PATH=$(pwd)
echo node lib path: ${NODE_ORACLE_CLIENT_PATH} 
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${NODE_ORACLE_CLIENT_PATH}
export PATH=${PATH}:${NODE_ORACLE_CLIENT_PATH}
cd ../../../

# install dependencies
sudo apt-get install -y libaio1

npm install
npm install --no-save oracledb

export DPI_DEBUG_LEVEL=16

export TEST_ORACLE_USER=system
export TEST_ORACLE_PASSWORD=oracle
export TEST_ORACLE_CONNECTION_STRING='(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SID=xe)))'
