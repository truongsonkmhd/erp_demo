# Backend image (Spring Boot, Java 21). Build context: repo root.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY erp-domain erp-domain
COPY erp-infrastructure erp-infrastructure
COPY erp-application erp-application
COPY erp-controller erp-controller
COPY erp-start erp-start
RUN --mount=type=cache,target=/root/.m2 mvn -q -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/erp-start/target/xxxx-start-1.0-SNAPSHOT.jar app.jar
ENV JAVA_OPTS="-Xmx1g"
EXPOSE 1122
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
