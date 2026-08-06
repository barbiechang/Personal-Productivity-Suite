using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivitySuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotebooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BackgroundColor",
                table: "NotebookPages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "NotebookId",
                table: "NotebookPages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "NotebookPages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PageSize",
                table: "NotebookPages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailDataUrl",
                table: "NotebookPages",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Notebooks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    CoverDataUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notebooks", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotebookPages_NotebookId",
                table: "NotebookPages",
                column: "NotebookId");

            migrationBuilder.AddForeignKey(
                name: "FK_NotebookPages_Notebooks_NotebookId",
                table: "NotebookPages",
                column: "NotebookId",
                principalTable: "Notebooks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NotebookPages_Notebooks_NotebookId",
                table: "NotebookPages");

            migrationBuilder.DropTable(
                name: "Notebooks");

            migrationBuilder.DropIndex(
                name: "IX_NotebookPages_NotebookId",
                table: "NotebookPages");

            migrationBuilder.DropColumn(
                name: "BackgroundColor",
                table: "NotebookPages");

            migrationBuilder.DropColumn(
                name: "NotebookId",
                table: "NotebookPages");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "NotebookPages");

            migrationBuilder.DropColumn(
                name: "PageSize",
                table: "NotebookPages");

            migrationBuilder.DropColumn(
                name: "ThumbnailDataUrl",
                table: "NotebookPages");
        }
    }
}
