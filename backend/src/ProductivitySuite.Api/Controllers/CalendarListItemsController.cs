using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateCalendarListItemRequest(int Year, int Month, CalendarListKind Kind, string Text);
public record UpdateCalendarListItemRequest(string? Text, bool? IsDone, int? Order);

[ApiController]
[Route("api/calendar-list-items")]
public class CalendarListItemsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CalendarListItem>>> GetAll([FromQuery] int year, [FromQuery] int month, [FromQuery] CalendarListKind kind)
    {
        var items = await db.CalendarListItems
            .Where(i => i.Year == year && i.Month == month && i.Kind == kind)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<CalendarListItem>> Create(CreateCalendarListItemRequest input)
    {
        var maxOrder = await db.CalendarListItems
            .Where(i => i.Year == input.Year && i.Month == input.Month && i.Kind == input.Kind)
            .Select(i => (int?)i.Order)
            .MaxAsync() ?? -1;

        var item = new CalendarListItem
        {
            Year = input.Year,
            Month = input.Month,
            Kind = input.Kind,
            Text = input.Text,
            Order = maxOrder + 1,
        };
        db.CalendarListItems.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CalendarListItem>> Update(Guid id, UpdateCalendarListItemRequest input)
    {
        var item = await db.CalendarListItems.FindAsync(id);
        if (item is null) return NotFound();

        item.Text = input.Text ?? item.Text;
        item.IsDone = input.IsDone ?? item.IsDone;
        item.Order = input.Order ?? item.Order;
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.CalendarListItems.FindAsync(id);
        if (item is null) return NotFound();

        db.CalendarListItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
