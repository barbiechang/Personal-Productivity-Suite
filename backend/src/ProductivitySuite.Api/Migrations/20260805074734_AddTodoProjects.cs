using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivitySuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTodoProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "Todos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "TodoBannerDataUrl",
                table: "DashboardSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TodoBannerIconDataUrl",
                table: "DashboardSettings",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TodoProjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CoverDataUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TodoProjects", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Todos_ProjectId",
                table: "Todos",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Todos_TodoProjects_ProjectId",
                table: "Todos",
                column: "ProjectId",
                principalTable: "TodoProjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Todos_TodoProjects_ProjectId",
                table: "Todos");

            migrationBuilder.DropTable(
                name: "TodoProjects");

            migrationBuilder.DropIndex(
                name: "IX_Todos_ProjectId",
                table: "Todos");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Todos");

            migrationBuilder.DropColumn(
                name: "TodoBannerDataUrl",
                table: "DashboardSettings");

            migrationBuilder.DropColumn(
                name: "TodoBannerIconDataUrl",
                table: "DashboardSettings");
        }
    }
}
