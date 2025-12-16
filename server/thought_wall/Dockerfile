# Stage 1: Build the application
# Using eclipse-temurin:25-jdk (Linux) instead of nanoserver (Windows)
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /app

# Copy the Maven wrapper and configuration
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Fix potential Windows line endings in the wrapper script
RUN sed -i 's/\r$//' mvnw
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy the source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:25-jdk

WORKDIR /app

# Copy the built JAR file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port
EXPOSE 8081

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]