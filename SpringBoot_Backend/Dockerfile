#Use an official MAven image to build application
FROM maven:3.9.6-eclipse-temurin-21 AS build

# set the  working directory
WORKDIR /app

#copy the pom.xml and install dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

#copy the source code and build th eapplication
COPY src ./src
RUN mvn clean package -DskipTests

#use official image to run ap
FROM eclipse-temurin:21-jdk-alpine

#set the working dir
WORKDIR /app

# copy the built jar file from build storage
COPY --from=build /app/target/HashChatBackend-0.0.1-SNAPSHOT.jar .

EXPOSE 8080

#command to run the app
ENTRYPOINT ["java","-jar","/app/HashChatBackend-0.0.1-SNAPSHOT.jar"]