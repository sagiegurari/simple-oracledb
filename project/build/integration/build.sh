#!/bin/bash

set -ev

cd "${0%/*}"

export PARENT_HOST=`/sbin/ip route|awk '/default/ { print  $3}'`
echo "parent host: ${PARENT_HOST}"

docker pull wnameless/oracle-xe-11g
docker run --name db -d -p 1521:1521 -e ORACLE_ALLOW_REMOTE=true wnameless/oracle-xe-11g

docker ps -a

docker build -t test .

docker run --link db:db --env PARENT_HOST="${PARENT_HOST}" --add-host dockerhost:${PARENT_HOST} --name test -t --cidfile ./test.cid test
