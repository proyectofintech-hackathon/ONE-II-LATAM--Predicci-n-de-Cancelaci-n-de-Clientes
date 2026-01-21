# --- Etapa 1: Construcción (Build) ---
# Usamos Maven con Java 21 (Eclipse Temurin)
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Compilamos el proyecto
RUN mvn clean package -DskipTests

# --- Etapa 2: Ejecución (Run) ---
# CAMBIO CLAVE: Usamos Eclipse Temurin 21 para correr la app
FROM eclipse-temurin:21-jdk

WORKDIR /app
# Copiamos el .jar generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]