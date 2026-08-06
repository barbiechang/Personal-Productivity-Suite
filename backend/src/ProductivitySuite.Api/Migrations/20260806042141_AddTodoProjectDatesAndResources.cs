using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivitySuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTodoProjectDatesAndResources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "TodoProjects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "TodoProjects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TodoProjectResources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: true),
                    FileDataUrl = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TodoProjectResources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TodoProjectResources_TodoProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "TodoProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TodoProjectResources_ProjectId",
                table: "TodoProjectResources",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TodoProjectResources");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "TodoProjects");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "TodoProjects");
        }
    }
}
