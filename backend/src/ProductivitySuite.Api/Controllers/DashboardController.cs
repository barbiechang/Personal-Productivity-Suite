using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record DashboardSettingsRequest(
    string? PetGifDataUrl,
    string? FamilyCoverDataUrl,
    string? TodoBannerDataUrl,
    string? TodoBannerIconDataUrl,
    string? CalendarBannerDataUrl,
    string? CalendarBannerIconDataUrl
);
public record CreateDashboardImageRequest(string DataUrl);

[ApiController]
[Route("api/dashboard")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("settings")]
    public async Task<ActionResult<DashboardSettings>> GetSettings()
    {
        var settings = await db.DashboardSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new DashboardSettings();
            db.DashboardSettings.Add(settings);
            await db.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPut("settings")]
    public async Task<ActionResult<DashboardSettings>> UpdateSettings(DashboardSettingsRequest input)
    {
        var settings = await db.DashboardSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new DashboardSettings();
            db.DashboardSettings.Add(settings);
        }

        settings.PetGifDataUrl = input.PetGifDataUrl ?? settings.PetGifDataUrl;
        settings.FamilyCoverDataUrl = input.FamilyCoverDataUrl ?? settings.FamilyCoverDataUrl;
        settings.TodoBannerDataUrl = input.TodoBannerDataUrl ?? settings.TodoBannerDataUrl;
        settings.TodoBannerIconDataUrl = input.TodoBannerIconDataUrl ?? settings.TodoBannerIconDataUrl;
        settings.CalendarBannerDataUrl = input.CalendarBannerDataUrl ?? settings.CalendarBannerDataUrl;
        settings.CalendarBannerIconDataUrl = input.CalendarBannerIconDataUrl ?? settings.CalendarBannerIconDataUrl;
        settings.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(settings);
    }

    [HttpGet("images")]
    public async Task<ActionResult<List<DashboardImage>>> GetImages() =>
        Ok(await db.DashboardImages.OrderBy(i => i.Order).ToListAsync());

    [HttpPost("images")]
    public async Task<ActionResult<DashboardImage>> AddImage(CreateDashboardImageRequest input)
    {
        var maxOrder = await db.DashboardImages.Select(i => (int?)i.Order).MaxAsync() ?? -1;
        var image = new DashboardImage { DataUrl = input.DataUrl, Order = maxOrder + 1 };
        db.DashboardImages.Add(image);
        await db.SaveChangesAsync();
        return Ok(image);
    }

    [HttpDelete("images/{id:guid}")]
    public async Task<IActionResult> DeleteImage(Guid id)
    {
        var image = await db.DashboardImages.FindAsync(id);
        if (image is null) return NotFound();

        db.DashboardImages.Remove(image);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
