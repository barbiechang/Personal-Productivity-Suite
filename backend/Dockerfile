# Build context: backend/ (e.g. Render "Root Directory" = backend, Dockerfile Path = Dockerfile)

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ProductivitySuite.sln ./
COPY src/ProductivitySuite.Api/ProductivitySuite.Api.csproj src/ProductivitySuite.Api/
RUN dotnet restore ProductivitySuite.sln

COPY src/ProductivitySuite.Api/ src/ProductivitySuite.Api/
RUN dotnet publish src/ProductivitySuite.Api/ProductivitySuite.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ProductivitySuite.Api.dll"]
