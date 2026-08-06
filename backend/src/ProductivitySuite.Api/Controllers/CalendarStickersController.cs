using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateCalendarStickerRequest(int Year, int Month, CalendarStickerRegion Region, string ImageDataUrl, double X, double Y, double Width, double Height);
public record UpdateCalendarStickerRequest(double? X, double? Y, double? Width, double? Height, int? ZIndex);

[ApiController]
[Route("api/calendar-stickers")]
public class CalendarStickersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CalendarSticker>>> GetAll([FromQuery] int year, [FromQuery] int month, [FromQuery] CalendarStickerRegion region)
    {
        var stickers = await db.CalendarStickers
            .Where(s => s.Year == year && s.Month == month && s.Region == region)
            .OrderBy(s => s.ZIndex)
            .ToListAsync();
        return Ok(stickers);
    }

    [HttpPost]
    public async Task<ActionResult<CalendarSticker>> Create(CreateCalendarStickerRequest input)
    {
        var maxZ = await db.CalendarStickers
            .Where(s => s.Year == input.Year && s.Month == input.Month && s.Region == input.Region)
            .Select(s => (int?)s.ZIndex)
            .MaxAsync() ?? 0;

        var sticker = new CalendarSticker
        {
            Year = input.Year,
            Month = input.Month,
            Region = input.Region,
            ImageDataUrl = input.ImageDataUrl,
            X = input.X,
            Y = input.Y,
            Width = input.Width,
            Height = input.Height,
            ZIndex = maxZ + 1,
        };
        db.CalendarStickers.Add(sticker);
        await db.SaveChangesAsync();
        return Ok(sticker);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CalendarSticker>> Update(Guid id, UpdateCalendarStickerRequest input)
    {
        var sticker = await db.CalendarStickers.FindAsync(id);
        if (sticker is null) return NotFound();

        sticker.X = input.X ?? sticker.X;
        sticker.Y = input.Y ?? sticker.Y;
        sticker.Width = input.Width ?? sticker.Width;
        sticker.Height = input.Height ?? sticker.Height;
        sticker.ZIndex = input.ZIndex ?? sticker.ZIndex;
        await db.SaveChangesAsync();
        return Ok(sticker);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var sticker = await db.CalendarStickers.FindAsync(id);
        if (sticker is null) return NotFound();

        db.CalendarStickers.Remove(sticker);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
