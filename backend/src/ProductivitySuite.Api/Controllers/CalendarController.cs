using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

[ApiController]
[Route("api/events")]
public class CalendarController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CalendarEvent>>> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = db.CalendarEvents.AsQueryable();
        if (from is not null) query = query.Where(e => e.EndAt >= from);
        if (to is not null) query = query.Where(e => e.StartAt <= to);
        return Ok(await query.OrderBy(e => e.StartAt).ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<CalendarEvent>> Create(CalendarEvent input)
    {
        var ev = new CalendarEvent
        {
            Title = input.Title,
            Description = input.Description,
            StartAt = input.StartAt,
            EndAt = input.EndAt,
            AllDay = input.AllDay,
        };
        db.CalendarEvents.Add(ev);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = ev.Id }, ev);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CalendarEvent>> Update(Guid id, CalendarEvent input)
    {
        var ev = await db.CalendarEvents.FindAsync(id);
        if (ev is null) return NotFound();

        ev.Title = input.Title;
        ev.Description = input.Description;
        ev.StartAt = input.StartAt;
        ev.EndAt = input.EndAt;
        ev.AllDay = input.AllDay;
        await db.SaveChangesAsync();
        return Ok(ev);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ev = await db.CalendarEvents.FindAsync(id);
        if (ev is null) return NotFound();

        db.CalendarEvents.Remove(ev);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
