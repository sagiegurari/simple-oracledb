FROM collinestes/docker-node-oracle

RUN mkdir /test
WORKDIR /test
ADD ./* /test/
RUN chmod -R 777 /test

ENV TEST_ORACLE_USER=system
ENV TEST_ORACLE_PASSWORD=oracle

CMD ["./test.sh"]
