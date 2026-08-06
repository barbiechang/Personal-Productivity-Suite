using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivitySuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarBanner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CalendarBannerDataUrl",
                table: "DashboardSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CalendarBannerIconDataUrl",
                table: "DashboardSettings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CalendarBannerDataUrl",
                table: "DashboardSettings");

            migrationBuilder.DropColumn(
                name: "CalendarBannerIconDataUrl",
                table: "DashboardSettings");
        }
    }
}
