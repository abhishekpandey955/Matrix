# Build with the same Java release used by the application.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn --batch-mode --no-transfer-progress -DskipTests package

# Keep the runtime image small and run as a non-root user.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/medicare-api.jar /app/medicare-api.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "/app/medicare-api.jar"]