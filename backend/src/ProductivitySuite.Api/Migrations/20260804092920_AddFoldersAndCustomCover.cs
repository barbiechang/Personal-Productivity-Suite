using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivitySuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFoldersAndCustomCover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CoverIsCustom",
                table: "Notebooks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "FolderId",
                table: "Notebooks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Folders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Folders", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notebooks_FolderId",
                table: "Notebooks",
                column: "FolderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notebooks_Folders_FolderId",
                table: "Notebooks",
                column: "FolderId",
                principalTable: "Folders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notebooks_Folders_FolderId",
                table: "Notebooks");

            migrationBuilder.DropTable(
                name: "Folders");

            migrationBuilder.DropIndex(
                name: "IX_Notebooks_FolderId",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "CoverIsCustom",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "FolderId",
                table: "Notebooks");
        }
    }
}
